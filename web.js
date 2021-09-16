import keystore from "keystore-idb";
import { CryptoSystem } from "keystore-idb/lib/types.js";
var timestamp = require('monotonic-timestamp')
var stringify = require('json-stable-stringify')
const KEYSTORE_CFG = { type: CryptoSystem.RSA };
let ks = null;
var { clone, isObject, isInvalidShape } = require('./util')

export const clear = async () => {
    ks = await get();
    await ks.destroy();
    ks = null;
};

export const create = async () => {
    return (await keystore.init(KEYSTORE_CFG));
};

export const set = async (userKeystore) => {
    ks = userKeystore;
};

export const get = async () => {
    if (ks) return ks;
    ks = (await keystore.init(KEYSTORE_CFG));
    return ks;
};

function createKeys () {
    return get()
}

async function sign (keys, msg) {
    var sig = await keys.sign(msg)
    return sig
}

async function createMsg (keys, prevMsg, content) {
    if (!isObject(content) && !isEncrypted(content)) {
        throw new Error('invalid message content, ' +
            'must be object or encrypted string')
    }

    const writeKey = await keys.publicWriteKey()

    var msg = {
        previous: prevMsg ? getId(prevMsg) : null,
        sequence: prevMsg ? prevMsg.sequence + 1 : 1,

        // change this
        author: '@' + writeKey,

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

async function verifyObj (keys, obj) {
    obj = clone(obj);
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
        throw new Error('signature should be base64 string,' +
            'did you mean verifyObj(public, signed_obj)?')
    }

    const publicKey = await keys.publicWriteKey()
    var _msg = Buffer.isBuffer(msg) ? msg : Buffer.from(msg)
    return keys.verify(_msg, sig, publicKey)
}

module.exports = {
    createKeys,
    sign,
    createMsg,
    signObj,
    verifyObj
}
