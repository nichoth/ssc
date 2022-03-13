// import * as uint8arrays from "uint8arrays";
import { fromString } from 'uint8arrays/from-string'
import keystore from "keystore-idb";
// import { webcrypto } from 'one-webcrypto'
import { verify } from "keystore-idb/lib/ecc/operations";
// import { CryptoSystem } from "keystore-idb/lib/types.js";
var timestamp = require('monotonic-timestamp')
var stringify = require('json-stable-stringify')
var { clone, isObject, isInvalidShape, getId,
    publicKeyToDid, didToPublicKey } = require('./util')

// const KEYSTORE_CFG = { type: CryptoSystem.RSA };
// const ECC = CryptoSystem.ECC

let keys = null

// const SIG_TYPE = 'ecc'

// 'ecc' or 'rsa'
const get = async (keyType) => {
    if (keys) return keys;
    keys = await keystore.init({ type: keyType });
    return keys;
};

function createKeys (type) {
    return get(type)
}

async function sign (keys, msg) {
    var sig = await keys.sign(msg)
    return sig
}

async function createMsg (keyStore, prevMsg, content) {
    if (!isObject(content) && !isEncrypted(content)) {
        throw new Error('invalid message content, ' +
            'must be object or encrypted string')
    }

    const writeKey = await keyStore.publicWriteKey()
    const keyType = 'ed25519'
    const ourDID = publicKeyToDid(writeKey, keyType)

    var msg = {
        previous: prevMsg ? getId(prevMsg) : null,
        sequence: prevMsg ? prevMsg.sequence + 1 : 1,
        // author: '@' + writeKey + '.' + keyType,
        author: ourDID,
        timestamp: +timestamp(),
        hash: 'sha256',
        content: content
    }

    var err = isInvalidShape(msg)
    if (err) throw err
    var ob = await signObj(keys, msg)
    return ob
}

async function signObj (keys, obj) {
    var _obj = clone(obj)
    var b = Buffer.from(stringify(_obj, null, 2))
    _obj.signature = await sign(keys, b)
    return _obj
}

// TODO verify with just a public key
// async function verifyObj (keys, _obj) {
async function verifyObj (pubKey, _obj) {
    var obj = clone(_obj);
    var sig = obj.signature;
    delete obj.signature;
    // const b = fromString('foooooo')
    const msgArr = fromString(stringify(obj, null, 2))
    // var b = Buffer.from(stringify(obj, null, 2));
    return _verify(pubKey, sig, msgArr);
}

// takes a public key, signature, and a hash
// and returns true if the signature was valid.
// the msg here does not include the `signature` field
async function _verify (pubKey, sig, msg) {
    if (typeof sig === 'object') {
        throw new Error('signature should be base64 string. ' +
            'Did you mean verifyObj(public, signed_obj)?')
    }

    return verify(msg, sig, pubKey)
}

function isPrevMsgOk (prevMsg, msg) {
    if (prevMsg === null) return (msg.previous === null)
    return (msg.previous === getId(prevMsg))
}

async function isValidMsg (msg, prevMsg, pubKey) {
    return (await verifyObj(pubKey, msg) && isPrevMsgOk(prevMsg, msg))
}

function getAuthor (msg) {
    return msg.author
}

function getDidFromKeys (ks) {
    return ks.publicWriteKey()
        .then(publicKey => {
            var did = publicKeyToDid(publicKey)
            return did
        })
}

const KEY_TYPES = { ECC: 'ecc', RSA: 'rsa' }

module.exports = {
    get,
    getId,
    createKeys,
    sign,
    createMsg,
    signObj,
    verify: _verify,
    verifyObj,
    isValidMsg,
    getAuthor,
    getDidFromKeys,
    publicKeyToDid,
    didToPublicKey,
    keyTypes: KEY_TYPES
}
