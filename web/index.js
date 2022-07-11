var timestamp = require('monotonic-timestamp')
var stringify = require('json-stable-stringify')
import { clone, isObject, isInvalidShape, getId,
    publicKeyToDid, didToPublicKey, normalizeUnicodeToBuf,
    importPublicKey, normalizeBase64ToBuf } from './util.js'
import { DEFAULT_CHAR_SIZE } from '../CONSTANTS.js'

module.exports = Ssc
export default Ssc

const webcrypto = window.crypto

const DEFAULT_ECC_CURVE = 'P-256'
const DEFAULT_HASH_ALG = 'SHA-256'


async function verify (msg, sig, publicKey/*, charSize, curve, hashAlg*/) {
    return webcrypto.subtle.verify({
        name: 'ECDSA',
        hash: { name: DEFAULT_HASH_ALG }
    },
        typeof publicKey === "string" ?
            // https://github.com/fission-suite/keystore-idb/blob/53f9d7646885db5a1632b63909d25d3b1895c2e5/src/types.ts#L69
            // await keys.importPublicKey(publicKey, curve, KeyUse.Write) :
            await importPublicKey(publicKey, DEFAULT_ECC_CURVE, 'write') :
            publicKey,
        normalizeBase64ToBuf(sig),
        normalizeUnicodeToBuf(msg)
    )
        .then(ver => {
            return ver
        })
}


function Ssc (keystore) {
    let keys = null
    let cacheStoreName = null
    const KEY_TYPES = { ECC: 'ecc', RSA: 'rsa' }
    // const KEY_TYPE = 'ed25519'  // ??? 

    return {
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
        // didToId,
        idToPublicKey,
        keyTypes: KEY_TYPES
    }

    function get (keyType, storeName) {
        storeName = storeName || null
        if (keys && storeName === cacheStoreName) return Promise.resolve(keys);
        return keystore.init({ type: keyType, storeName }).then(_keys => {
            keys = _keys
            return _keys
        })
        .catch(err => {
            console.log('errrrrrrrrrrr', err)
        })
    }

    function createKeys (type, opts) {
        opts = opts || {}
        const storeName = opts.storeName
        return get(type || KEY_TYPES.ECC, storeName)
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
        const ourDID = publicKeyToDid(writeKey)

        const msg = {
            previous: prevMsg ? await getId(prevMsg) : null,
            sequence: prevMsg ? prevMsg.sequence + 1 : 1,
            // author: '@' + writeKey + '.' + KEY_TYPE,
            author: ourDID,
            timestamp: +timestamp(),
            hash: 'sha256',
            content: content
        }

        const err = isInvalidShape(msg)
        if (err) throw err
        var obj = await signObj(keyStore, msg)
        return obj
    }

    async function signObj (keys, obj) {
        var b = normalizeUnicodeToBuf(stringify(obj), DEFAULT_CHAR_SIZE)
        var _obj = clone(obj)
        _obj.signature = (await sign(keys, b))
        return _obj
    }

    async function verifyObj (pubKey, _obj) {
        var obj = clone(_obj);
        var sig = obj.signature;
        delete obj.signature;
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
        return getId(prevMsg)
            .then(id => {
                return (msg.previous === id)
            })
    }

    function isValidMsg (msg, prevMsg, pubKey) {
        return verifyObj(pubKey, msg)
            .then(async ver => {
                return (ver && await isPrevMsgOk(prevMsg, msg))
            })
    }

    function getAuthor (msg) {
        return msg.author
    }

    // (ks: keystore)
    function getDidFromKeys (ks) {
        return ks.publicWriteKey()
            .then(publicKey => {
                var did = publicKeyToDid(publicKey)
                return did
            })
    }


    // function didToId (did) {
    //     const pubKey = didToPublicKey(did).publicKey
    //     return '@' + pubKey + '.' + KEY_TYPE
    // }

    function idToPublicKey (id) {
        return id.slice(1).split('.')[0]
    }

}





// module.exports = {
//     get,
//     getId,
//     createKeys,
//     sign,
//     createMsg,
//     signObj,
//     verify: _verify,
//     verifyObj,
//     isValidMsg,
//     getAuthor,
//     getDidFromKeys,
//     publicKeyToDid,
//     didToPublicKey,
//     // didToId,
//     idToPublicKey,
//     keyTypes: KEY_TYPES
// }

// export default {
//     get,
//     getId,
//     createKeys,
//     sign,
//     createMsg,
//     signObj,
//     verify: _verify,
//     verifyObj,
//     isValidMsg,
//     getAuthor,
//     getDidFromKeys,
//     publicKeyToDid,
//     didToPublicKey,
//     // didToId,
//     idToPublicKey,
//     keyTypes: KEY_TYPES
// }
