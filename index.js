var sodium = require("chloride")
var hmac = sodium.crypto_auth
var curve = require('./sodium')
var timestamp = require('monotonic-timestamp')
var isCanonicalBase64 = require('is-canonical-base64')
var isEncryptedRx = isCanonicalBase64('','\\.box.*')
var feedIdRegex = isCanonicalBase64('@', '.(?:sha256|ed25519)', 32)
var ssbKeys = require('ssb-keys')
var stringify = require('json-stable-stringify')


module.exports = {
    verifyObj,
    createMsg,
    getId,
    isPrevMsgOk,
    isValidMsg,
    createKeys,
    generate: ssbKeys.generate,
    hash
}

function createKeys () {
    return ssbKeys.generate()
}

// from ssb-keys
// https://github.com/ssb-js/ssb-keys/blob/2342a85c5bd4a1cf8739b7b09eb2f667f735bd08/util.js#L4
function hash (data, enc) {
    data = (typeof data === 'string' && enc == null) ?
        Buffer.from(data, "binary") :
        Buffer.from(data, enc);
    return sodium.crypto_hash_sha256(data).toString("base64") + ".sha256"
}


function getId (msg) {
    return '%' + hash(stringify(msg, null, 2))
}

// see https://github.com/ssb-js/ssb-keys/blob/main/index.js#L113 and
// https://github.com/ssb-js/ssb-validate/blob/main/index.js#L317

// need to implement `checkInvalidCheap`
// https://github.com/ssb-js/ssb-validate/blob/main/index.js#L134
// `checkInvalidCheap` is where we check that the prev/next msgs have the
// right keys

// here is where the calls start
// https://github.com/ssb-js/ssb-validate/blob/main/index.js#L167
// first `checkInvalidCheap`, then `verifyObj`

function hasSigil (s) {
    return /^(@|%|&)/.test(s);
}

var u = {
    toBuffer: function (buf) {
        if (buf == null) return buf;
        if (Buffer.isBuffer(buf)) return buf;
        var i = buf.indexOf(".");
        var start = hasSigil(buf) ? 1 : 0;
        return Buffer.from(
            buf.substring(start, ~i ? i : buf.length),
            "base64"
        )
    }
}

// just creates a msg, doesn't check that the `msg.previous` key is valid
function createMsg (keys, prevMsg, content) {
    // state here is { id, sequence }
    // exports.create = function (state, keys, hmac_key, content, timestamp) {


    if (!isObject(content) && !isEncrypted(content)) {
        throw new Error('invalid message content, ' +
            'must be object or encrypted string')
    }

    var msg = {
        previous: prevMsg ? getId(prevMsg) : null,
        sequence: prevMsg ? prevMsg.sequence + 1 : 1,
        author: keys.id,
        timestamp: +timestamp(),
        hash: 'sha256',
        content: content
    }

    var err = isInvalidShape(msg)
    if (err) throw err
    return signObj(keys, null, msg)
}

function verifyObj (keys, hmac_key, obj) {
    if (!obj) (obj = hmac_key), (hmac_key = null);
    obj = clone(obj);
    var sig = obj.signature;
    delete obj.signature;
    var b = Buffer.from(stringify(obj, null, 2));
    if (hmac_key) b = hmac(b, u.toBuffer(hmac_key));
    return verify(keys, sig, b);
}

function isValidMsg (msg, prevMsg, keys) {
    return (verifyObj(keys, null, msg) && isPrevMsgOk(prevMsg, msg))
}

function isPrevMsgOk (prevMsg, msg) {
    if (prevMsg === null) return (msg.previous === null)
    return (msg.previous === getId(prevMsg))
}

// takes a public key, signature, and a hash
// and returns true if the signature was valid.
// the msg here does not include the `signature` field
function verify (keys, sig, msg) {
    if (typeof sig === 'object') {
        throw new Error('signature should be base64 string,' +
            'did you mean verifyObj(public, signed_obj)')
    }

    return curve.verify(
        u.toBuffer(keys.public || keys),
        u.toBuffer(sig),
        Buffer.isBuffer(msg) ? msg : Buffer.from(msg)
    )
}

function clone (obj) {
    var _obj = {}
    for (var k in obj) {
        if (Object.hasOwnProperty.call(obj, k)) _obj[k] = obj[k]
    }
    return _obj
}

function sign (keys, msg) {
    if (isString(msg)) msg = Buffer.from(msg);
    if (!Buffer.isBuffer(msg)) throw new Error("msg should be buffer");

    return (curve
        .sign(u.toBuffer(keys.private), msg)
        .toString("base64") + ".sig." + 'ed25519'
    )
}

function signObj (keys, hmac_key, obj) {
    if (!obj) {
        obj = hmac_key
        hmac_key = null
    }
    var _obj = clone(obj)
    var b = Buffer.from(stringify(_obj, null, 2))
    if (hmac_key) b = hmac(b, u.toBuffer(hmac_key))
    _obj.signature = sign(keys, b)
    return _obj
}

function isString (s) {
    return s && 'string' === typeof s
}

function isInteger (n) {
    return ~~n === n
}

function isObject (o) {
    return o && 'object' === typeof o
}

function isValidOrder (msg, signed) {
    var keys = Object.keys(msg)

    if (signed && keys.length !== 7) return false

    if (
        keys[0] !== 'previous' ||
        keys[3] !== 'timestamp' ||
        keys[4] !== 'hash' ||
        keys[5] !== 'content' ||
        (signed && keys[6] !== 'signature')
    ) {
        return false
    }

    // author and sequence may be swapped.
    if (!(
        (keys[1] === 'sequence' && keys[2] === 'author') ||
        (keys[1] === 'author' && keys[2] === 'sequence')
    )) {
        return false
    }

    return true
}

function isInvalidShape  (msg) {
    if (
        !isObject(msg) ||
        !isInteger(msg.sequence) ||
        !isFeedId(msg.author) ||
        !(isObject(msg.content) || isEncrypted(msg.content)) ||
        !isValidOrder(msg, false) || //false, because message may not be signed yet.
        !isSupportedHash(msg)
    ) {
        return new Error('message has invalid properties:' +
            JSON.stringify(msg, null, 2))
    }

    //allow encrypted messages, where content is a base64 string.

    //NOTE: since this checks the length of javascript string,
    //it's not actually the byte length! it's the number of utf8 chars
    //for latin1 it's gonna be 8k, but if you use all utf8 you can
    //approach 32k. This is a weird legacy thing, obviously, that
    //we will fix at some point...
    var asJson = encode(msg)
    if (asJson.length > 8192) { // 8kb
        return new Error('Encoded message must not be larger than 8192' +
            'bytes. Current size is ' + asJson.length)
    }

    return isInvalidContent(msg.content)
}

function isEncrypted (str) {
    //NOTE: does not match end of string,
    //so future box version are accepted.
    //XXX check that base64 is canonical!

    ///^[0-9A-Za-z\/+]+={0,2}\.box/.test(str)
    return isString(str) && isEncryptedRx.test(str)
}

function isSupportedHash (msg) {
    return msg.hash === 'sha256'
}

function encode  (obj) {
    return stringify(obj, null, 2)
}

function isInvalidContent  (content) {
    if (!isEncrypted(content)) {
        var type = content.type
        if (!(isString(type) && type.length <= 52 && type.length >= 3)) {
            return new Error('type must be a string' +
                '3 <= type.length < 52, was:' + type)
        }
    }
    return false
}

function isFeedId (data) {
    return isString(data) && feedIdRegex.test(data)
}

