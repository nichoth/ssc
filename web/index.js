import keystore from "keystore-idb";
import { verify } from "keystore-idb/lib/ecc/operations";
var timestamp = require('monotonic-timestamp')
var stringify = require('json-stable-stringify')
import { clone, isObject, isInvalidShape, getId,
    publicKeyToDid, didToPublicKey } from './util.js'
import * as utils from 'keystore-idb/lib/utils.js'
import { DEFAULT_CHAR_SIZE } from '../CONSTANTS.js'

let keys = null
const KEY_TYPES = { ECC: 'ecc', RSA: 'rsa' }
const KEY_TYPE = 'ed25519'

function get (keyType) {
    if (keys) return Promise.resolve(keys);
    return keystore.init({ type: keyType }).then(_keys => {
        keys = _keys
        return _keys
    })
}

function createKeys (type) {
    return get(type || KEY_TYPES.ECC)
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

    const msg = {
        previous: prevMsg ? getId(prevMsg) : null,
        sequence: prevMsg ? prevMsg.sequence + 1 : 1,
        author: '@' + writeKey + '.' + KEY_TYPE,
        // author: ourDID,
        timestamp: +timestamp(),
        hash: 'sha256',
        content: content
    }

    var err = isInvalidShape(msg)
    if (err) throw err
    var obj = await signObj(keys, msg)
    return obj
}

async function signObj (keys, obj) {
    var _obj = clone(obj)
    var b = utils.normalizeUnicodeToBuf(stringify(obj), DEFAULT_CHAR_SIZE)
    _obj.signature = (await sign(keys, b) + '.sig.ed25519')
    return _obj
}

async function verifyObj (pubKey, _obj) {
    var obj = clone(_obj);
    var sig = obj.signature;
    sig = sig.replace('.sig.ed25519', '')
    delete obj.signature;
    // const msgArr = fromString(stringify(obj, null, 2))
    const msgStr = stringify(obj, null, 2)
    return _verify(pubKey, sig, msgStr);
}

// takes a public key, signature, and a hash
// and returns true if the signature was valid.
// the msg here does not include the `signature` field
async function _verify (pubKey, sig, msg) {
    if (typeof sig === 'object') {
        throw new Error('signature should be base64 string. ' +
            'Did you mean verifyObj(public, signed_obj)?')
    }

    // default_ecc_curve = 'p-256'
    return verify(msg, sig, pubKey)
}

function isPrevMsgOk (prevMsg, msg) {
    if (prevMsg === null) return (msg.previous === null)
    return (msg.previous === getId(prevMsg))
}

function isValidMsg (msg, prevMsg, pubKey) {
    return verifyObj(pubKey, msg)
        .then(ver => {
            return ver && isPrevMsgOk(prevMsg, msg)
        })
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


function didToId (did) {
    const pubKey = didToPublicKey(did).publicKey
    return '@' + pubKey + '.' + KEY_TYPE
}

function idToPublicKey (id) {
    return id.slice(1).split('.')[0]
}

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
    didToId,
    idToPublicKey,
    keyTypes: KEY_TYPES
}

export default {
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
    didToId,
    idToPublicKey,
    keyTypes: KEY_TYPES
}
