import { createRequire } from 'module';
const require = createRequire(import.meta.url);
// import { toString } from 'uint8arrays/to-string'

var sodium = require("chloride")
var hmac = sodium.crypto_auth
// var curve = require('./sodium')
import curve from './sodium.js'
var timestamp = require('monotonic-timestamp')
var ssbKeys = require('ssb-keys')
var stringify = require('json-stable-stringify')
// var { clone, isObject, getId, hash, isInvalidShape,
//     isString } = require('./util')
import { clone, isObject, getId, hash, isInvalidShape,
    isString } from './util.js'
import { webcrypto } from 'one-webcrypto'
// const CONSTANTS = require('./CONSTANTS')
import { ECC_WRITE_ALG, DEFAULT_HASH_ALG,
    DEFAULT_CHAR_SIZE } from './CONSTANTS.js'
import * as utils from 'keystore-idb/lib/utils.js'
// import { getPublicKey } from 'keystore-idb/lib/ecc/operations.js'

export default {
    sign,
    verifyObj,
    verify,
    createMsg,
    getId,
    isPrevMsgOk,
    isValidMsg,
    createKeys,
    generate: ssbKeys.generate,
    hash
}

// module.exports = {
//     sign,
//     verifyObj,
//     verify,
//     createMsg,
//     getId,
//     isPrevMsgOk,
//     isValidMsg,
//     createKeys,
//     generate: ssbKeys.generate,
//     hash
// }

function createKeys () {
    const uses = ['sign', 'verify']

    return webcrypto.subtle.generateKey({
        name:  ECC_WRITE_ALG,
        namedCurve: 'P-256'
    }, false, uses)
        .then(key => {
            return {
                id: '',
                keys: key
            }
        })

    // return {
    //     id: '',
    //     keys: webcrypto.subtle.generateKey({
    //         name:  ECC_WRITE_ALG,
    //         namedCurve: 'P-256'
    //     }, false, uses)
    // }
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
        var i = buf.indexOf('.')
        var start = hasSigil(buf) ? 1 : 0;
        return Buffer.from(
            buf.substring(start, ~i ? i : buf.length),
            "base64"
        )
    }
}



// just creates a msg, doesn't check that the `msg.previous` key is valid
async function createMsg (keys, prevMsg, content) {
    if (!isObject(content) && !isEncrypted(content)) {
        throw new Error('invalid message content, ' +
            'must be object or encrypted string')
    }

    // console.log('arguments', arguments)

    // const pubKey = await publicKeyToId(keys.keys)
    // console.log('pub key', pubKey)
    const id = await publicKeyToId(keys)

    var msg = {
        previous: prevMsg ? getId(prevMsg) : null,
        sequence: prevMsg ? prevMsg.sequence + 1 : 1,
        author: id,
        timestamp: +timestamp(),
        hash: 'sha256',
        content: content
    }

    var err = isInvalidShape(msg)
    if (err) throw err
    return signObj(keys, null, msg)
}

const KEY_TYPE = 'ed25519'

async function publicKeyToId (keypair) {
    // const jwk = await webcrypto.subtle.exportKey('jwk', keypair.publicKey)
    const raw = await webcrypto.subtle.exportKey('raw', keypair.publicKey)
    // console.log('jwk', jwk)
    // console.log('raw', raw)
    // console.log('to strinnnnnnnng', toString(raw))
    const str = utils.arrBufToBase64(raw)
    // console.log('*str*', str)
    return '@' + str + '.' + KEY_TYPE
    // return str
}


function verifyObj (keys, hmac_key, obj) {
    if (!obj) (obj = hmac_key), (hmac_key = null);
    obj = clone(obj);
    var sig = obj.signature;
    delete obj.signature;
    // var b = Buffer.from(stringify(obj, null, 2));
    // if (hmac_key) b = hmac(b, u.toBuffer(hmac_key));
    return verify(keys, sig, stringify(obj))
    // return verify(keys, sig, b);
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

    // return curve.verify(
    //     u.toBuffer(keys.public || keys),
    //     u.toBuffer(sig),
    //     Buffer.isBuffer(msg) ? msg : Buffer.from(msg)
    // )

    return webcrypto.subtle.verify(
        {
            name: ECC_WRITE_ALG,
            hash: { name: DEFAULT_HASH_ALG }
        },
        keys.publicKey,
        utils.normalizeBase64ToBuf(sig),
        utils.normalizeUnicodeToBuf(msg, DEFAULT_CHAR_SIZE)
    )


    // function verify(
    //     msg: Msg,
    //     sig: Msg,
    //     publicKey: string | PublicKey,
    //     charSize: CharSize = DEFAULT_CHAR_SIZE,
    //     curve: EccCurve = DEFAULT_ECC_CURVE,
    //     hashAlg: HashAlg = DEFAULT_HASH_ALG
    //   ): Promise<boolean> {
    //     return webcrypto.subtle.verify(
    //       { name: ECC_WRITE_ALG, hash: { name: hashAlg }},
    //       typeof publicKey === "string"
    //         ? await keys.importPublicKey(publicKey, curve, KeyUse.Write)
    //         : publicKey,
    //       normalizeBase64ToBuf(sig),
    //       normalizeUnicodeToBuf(msg, charSize)
    //     )
    // }
}


async function sign (keys, msg) {
    // if (isString(msg)) msg = Buffer.from(msg);
    // if (!Buffer.isBuffer(msg)) throw new Error("msg should be buffer");

    const sig = await webcrypto.subtle.sign(
        {
            name: ECC_WRITE_ALG,
            hash: { name: DEFAULT_HASH_ALG }
        },
        keys.privateKey,
        utils.normalizeUnicodeToBuf(msg, DEFAULT_CHAR_SIZE)
    )

    // var str = utils.arrBufToStr(sig)
    // console.log('*str*', str)
    // return str

    return utils.arrBufToBase64(sig)

    // return (curve
    //     .sign(u.toBuffer(keys.private || keys), msg)
    //     .toString("base64") + ".sig." + 'ed25519'
    // )
}

async function signObj (keys, hmac_key, obj) {
    if (!obj) {
        obj = hmac_key
        hmac_key = null
    }
    var _obj = clone(obj)
    // var b = Buffer.from(stringify(_obj, null, 2))
    const msgStr = stringify(_obj, null, 2)
    // if (hmac_key) b = hmac(b, u.toBuffer(hmac_key))
    _obj.signature = await sign(keys, msgStr)
    return _obj
}

// function normalizeUnicodeToBuf (msg, charSize) {
//     switch (charSize) {
//       case 8: return normalizeUtf8ToBuf(msg)
//       default: return normalizeUtf16ToBuf(msg)
//     }
// }

// function normalizeUtf8ToBuf (msg) {
//     return normalizeToBuf(msg, (str) => strToArrBuf(str, CharSize.B8))
// }
  
// function normalizeUtf16ToBuf (msg) {
//     return normalizeToBuf(msg, (str) => strToArrBuf(str, CharSize.B16))
// }
