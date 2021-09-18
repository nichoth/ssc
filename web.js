// import * as uint8arrays from "uint8arrays";
import keystore from "keystore-idb";
import { CryptoSystem } from "keystore-idb/lib/types.js";
var timestamp = require('monotonic-timestamp')
var stringify = require('json-stable-stringify')
let ks = null;
var { clone, isObject, isInvalidShape, getId, publicKeyToDid, encodeHeader,
    encodePayload, makeUrlUnsafe, decode,
    verifySignedData } = require('./util')
import * as ucan from 'webnative/ucan/token'
const KEYSTORE_CFG = { type: CryptoSystem.RSA };

// const clear = async () => {
//     ks = await get();
//     await ks.destroy();
//     ks = null;
// };

// const create = async () => {
//     return (await keystore.init(KEYSTORE_CFG));
// };

// const set = async (userKeystore) => {
//     ks = userKeystore;
// };

const get = async () => {
    if (ks) return ks;
    ks = await keystore.init(KEYSTORE_CFG);
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
    // @TODO
    const ourDID = publicKeyToDid(writeKey, "rsa")

    var msg = {
        previous: prevMsg ? getId(prevMsg) : null,
        sequence: prevMsg ? prevMsg.sequence + 1 : 1,

        // change this
        // author: '@' + writeKey,

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

function isPrevMsgOk (prevMsg, msg) {
    if (prevMsg === null) return (msg.previous === null)
    return (msg.previous === getId(prevMsg))
}

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

/**
 * Check if a UCAN is valid.
 * This is appropriate for checking if the UCANs are well-formed. You
 * would still need to check the permissions on the root UCAN
 *
 * @param ucan The decoded UCAN
 */
async function isValidUcan (ucan) {
    const encodedHeader = encodeHeader(ucan.header);
    const encodedPayload = encodePayload(ucan.payload);
    const a = await verifySignedData({
        charSize: 8,
        data: `${encodedHeader}.${encodedPayload}`,
        did: ucan.payload.iss,
        signature: makeUrlUnsafe(ucan.signature || '')
    });

    // if it's not valid, then we're done
    if (!a) return a;

    // has no proof, validation is done
    if (!ucan.payload.prf) return true;

    // Verify proof
    const prf = decode(ucan.payload.prf);
    // proof.audience must be ourUcan.issuer
    const b = prf.payload.aud === ucan.payload.iss;

    if (!b) return b;

    return await isValidUcan(prf);
}

function createUcan (arg) {
    return ucan.build(arg)
}


module.exports = {
    getId,
    createKeys,
    sign,
    createMsg,
    signObj,
    verifyObj,
    isValidMsg,
    getAuthor,
    getDidFromKeys,
    isValidUcan,
    createUcan
}
