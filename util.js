var sodium = require("chloride")
var stringify = require('json-stable-stringify')
var isCanonicalBase64 = require('is-canonical-base64')
// var feedIdRegex = isCanonicalBase64('@', '.(?:sha256|ed25519)', 32)
var isEncryptedRx = isCanonicalBase64('','\\.box.*')
import * as utils from 'keystore-idb/lib/utils'
import * as uint8arrays from "uint8arrays"

function clone (obj) {
    var _obj = {}
    for (var k in obj) {
        if (Object.hasOwnProperty.call(obj, k)) _obj[k] = obj[k]
    }
    return _obj
}

function isObject (o) {
    return o && 'object' === typeof o
}

function getId (msg) {
    return '%' + hash(stringify(msg, null, 2))
}

// from ssb-keys
// https://github.com/ssb-js/ssb-keys/blob/2342a85c5bd4a1cf8739b7b09eb2f667f735bd08/util.js#L4
function hash (data, enc) {
    data = (typeof data === 'string' && enc == null) ?
        Buffer.from(data, "binary") :
        Buffer.from(data, enc);
    return sodium.crypto_hash_sha256(data).toString("base64") + ".sha256"
}

function isInteger (n) {
    return ~~n === n
}

function isFeedId (data) {
    return isString(data) // && feedIdRegex.test(data)
}

function isString (s) {
    return s && 'string' === typeof s
}

function isEncrypted (str) {
    //NOTE: does not match end of string,
    //so future box version are accepted.
    //XXX check that base64 is canonical!

    ///^[0-9A-Za-z\/+]+={0,2}\.box/.test(str)
    return isString(str) && isEncryptedRx.test(str)
}

function encode  (obj) {
    return stringify(obj, null, 2)
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

function isSupportedHash (msg) {
    return msg.hash === 'sha256'
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

function isInvalidShape (msg) {
    if (
        !isObject(msg) ||
        !isInteger(msg.sequence) ||
        !isFeedId(msg.author) ||
        !(isObject(msg.content) ||
        isEncrypted(msg.content)) ||
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

function publicKeyToDid (publicKey, type) {
    const pubKeyBuf = utils.base64ToArrBuf(publicKey)
  
    // Prefix public-write key
    const prefix = magicBytes(type)
    if (prefix === null) {
      throw new Error(`Key type '${type}' not supported`)
    }
  
    const prefixedBuf = utils.joinBufs(prefix, pubKeyBuf)
  
    // Encode prefixed
    var arr = new Uint8Array(prefixedBuf)
    return BASE58_DID_PREFIX + uint8arrays.toString(arr, "base58btc")
}

const EDWARDS_DID_PREFIX = new Uint8Array([ 0xed, 0x01 ])
const BLS_DID_PREFIX = new Uint8Array([ 0xea, 0x01 ])
const RSA_DID_PREFIX = new Uint8Array([ 0x00, 0xf5, 0x02 ])
const BASE58_DID_PREFIX = "did:key:z"

const KeyType = {
    RSA: "rsa",
    Edwards: "ed25519",
    BLS: "bls12-381"
}

/**
 * Magic bytes.
 */
function magicBytes (keyType) {
    switch (keyType) {
        case KeyType.Edwards: return EDWARDS_DID_PREFIX
        case KeyType.RSA: return RSA_DID_PREFIX
        case KeyType.BLS: return BLS_DID_PREFIX
        default: return null
    }
}




module.exports = {
    clone,
    isObject,
    getId,
    hash,
    isInvalidShape,
    isString,
    publicKeyToDid,
    magicBytes
}
