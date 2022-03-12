// import * as uint8arrays from "uint8arrays";
import keystore from "keystore-idb";
// import { CryptoSystem } from "keystore-idb/lib/types.js";
var timestamp = require('monotonic-timestamp')
var stringify = require('json-stable-stringify')
var { clone, isObject, isInvalidShape, getId,
    publicKeyToDid } = require('./util')

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
    // const ourDID = publicKeyToDid(writeKey, keyType)

    // console.log('**write key**', writeKey + '.' + keyType)

    var msg = {
        previous: prevMsg ? getId(prevMsg) : null,
        sequence: prevMsg ? prevMsg.sequence + 1 : 1,

        // TODO
        // change this
        // author: '@' + writeKey,

        author: '@' + writeKey + '.' + keyType,

        // author: ourDID,

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

async function verifyObj (keys, _obj) {
    var obj = clone(_obj);
    var sig = obj.signature;
    delete obj.signature;
    var b = Buffer.from(stringify(obj, null, 2));
    return verify(keys, sig, b);
}

// takes a public key, signature, and a hash
// and returns true if the signature was valid.
// the msg here does not include the `signature` field
async function verify (keys, sig, msg) {
    if (typeof sig === 'object') {
        throw new Error('signature should be base64 string, ' +
            'did you mean verifyObj(public, signed_obj)?')
    }

    const publicKey = await keys.publicWriteKey()
    var _msg = Buffer.isBuffer(msg) ? msg : Buffer.from(msg)
    return keys.verify(_msg, sig, publicKey)
}

function isPrevMsgOk (prevMsg, msg) {
    if (prevMsg === null) return (msg.previous === null)
    return (msg.previous === getId(prevMsg))
}

// TODO
// should take just the public key here
//   - goes to a method `keys.verify`
async function isValidMsg (msg, prevMsg, keys) {
    return (await verifyObj(keys, msg) && isPrevMsgOk(prevMsg, msg))
}

function getAuthor (msg) {
    return msg.author
}

function getDidFromKeys (ks) {
    return ks.publicWriteKey()
        .then(publicKey => {
            var did = publicKeyToDid(publicKey, 'rsa')
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
    verifyObj,
    isValidMsg,
    getAuthor,
    getDidFromKeys,
    publicKeyToDid,
    keyTypes: KEY_TYPES
}
