import { createRequire } from 'module';
const require = createRequire(import.meta.url)
// const require = createRequire(__dirname)

var timestamp = require('monotonic-timestamp')
var ssbKeys = require('ssb-keys')
var stringify = require('json-stable-stringify')
import { clone, isObject, getId, hash, isInvalidShape,
    publicKeyToDid, didToPublicKey } from './util.js'
import { webcrypto } from 'one-webcrypto'
import { ECC_WRITE_ALG, DEFAULT_HASH_ALG,
    DEFAULT_CHAR_SIZE, DEFAULT_ECC_CURVE } from './CONSTANTS.js'
import * as utils from 'keystore-idb/lib/utils.js'

const KEY_TYPE = 'ed25519'

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
    hash,
    publicKeyToId,
    importKeys,
    exportKeys,
    idToPublicKey,
    publicKeyToDid,
    didToPublicKey,
    getAuthor
}

function getAuthor (msg) {
    return msg.author
}

function idToPublicKey (id) {
    const pubKeyStr = id.replace('@', '').replace('.ed25519', '')
    return pubKeyStr
}

function importKeys (userDoc) {
    return Promise.all([
        webcrypto.subtle.importKey(
            'raw',
            utils.base64ToArrBuf(userDoc.keys.public),
            { name: ECC_WRITE_ALG, namedCurve: DEFAULT_ECC_CURVE },
            true,
            ['verify']
        ),

        webcrypto.subtle.importKey(
            'pkcs8',
            utils.base64ToArrBuf(userDoc.keys.private),
            // buf,
            { name: ECC_WRITE_ALG, namedCurve: DEFAULT_ECC_CURVE },
            true,
            ['sign']
        )
    ])
        .then(([pub, priv]) => {
            return { publicKey: pub, privateKey: priv }
        })
}

function exportKeys (keypair) {
    return Promise.all([
        webcrypto.subtle.exportKey('raw', keypair.publicKey),
        webcrypto.subtle.exportKey('pkcs8', keypair.privateKey)
        // webcrypto.subtle.exportKey('raw', keypair.privateKey)
    ])
        .then(([pub, priv]) => {
            return {
                public: utils.arrBufToBase64(pub),
                private: utils.arrBufToBase64(priv)
            }
        })
}

// function getPublicKey () {

// }

// (ks: keystore)
// function getDidFromKeys (ks) {
//     return ks.publicWriteKey()
//         .then(publicKey => {
//             var did = publicKeyToDid(publicKey)
//             return did
//         })
// }

function createKeys () {
    const uses = ['sign', 'verify']

    return webcrypto.subtle.generateKey({
        name:  ECC_WRITE_ALG,
        namedCurve: 'P-256'
    }, true, uses)
        .then(keys => {
            return publicKeyToId(keys.publicKey)
                .then(id => {
                    return exportKeys(keys).then(exported => {
                        return {
                            did: publicKeyToDid(exported.public),
                            id,
                            keys
                        }
                    })
                })
        })
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



function isEncrypted (msg) {
    return (typeof msg.value.content == 'string')
}

// just creates a msg, doesn't check that the `msg.previous` key is valid
// TODO -- should verify the `previous` key is ok
async function createMsg (keys, prevMsg, content) {
    if (!isObject(content) && !isEncrypted(content)) {
        throw new Error('invalid message content, ' +
            'must be object or encrypted string')
    }

    const id = await publicKeyToId(keys.publicKey)

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

async function publicKeyToId (publicKey) {
    if (typeof publicKey === 'string') {
        return '@' + publicKey + '.' + KEY_TYPE
    }

    const raw = await webcrypto.subtle.exportKey('raw', publicKey)
    const str = utils.arrBufToBase64(raw)
    return '@' + str + '.' + KEY_TYPE
}

function verifyObj (publicKey, hmac_key, obj) {
    if (!obj) (obj = hmac_key), (hmac_key = null);
    obj = clone(obj);
    const sig = obj.signature;
    delete obj.signature;
    return verify(publicKey, sig, stringify(obj))
}

// this checks the signature and also the merkle integrity of the message with
// the given previous message
function isValidMsg (msg, prevMsg, publicKey) {
    if (typeof publicKey === 'string') {
        return webcrypto.subtle.importKey(
            'raw',
            utils.base64ToArrBuf(publicKey),
            { name: ECC_WRITE_ALG, namedCurve: DEFAULT_ECC_CURVE },
            true,
            ['verify']
        )
            .then(pubKey => {
                return verifyObj(pubKey, null, msg)
                    .then(isVal => isVal && isPrevMsgOk(prevMsg, msg))
            })
    }

    return verifyObj(publicKey, null, msg)
        .then(isVal => isVal && isPrevMsgOk(prevMsg, msg))
}

function isPrevMsgOk (prevMsg, msg) {
    if (prevMsg === null) return (msg.previous === null)
    return ((msg.previous === getId(prevMsg)) &&
        msg.sequence === prevMsg.sequence + 1)
}

// takes a public key, signature, and a hash
// and returns true if the signature was valid.
// the msg here does not include the `signature` field

function verify (publicKey, sig, msg) {
    if (typeof sig === 'object') {
        throw new Error('signature should be base64 string,' +
            'did you mean verifyObj(public, signed_obj)')
    }

    // if we're given a string, we need to convert that
    // into a publicKey instance
    if (typeof publicKey === 'string') {
        // console.log('****is string*****', publicKey)
        return webcrypto.subtle.importKey(
            'raw',
            utils.base64ToArrBuf(publicKey),
            { name: 'ECDSA', namedCurve: 'P-256' },
            true,
            ['verify']
        )
            .then(pubKey => {
                console.log(typeof msg)
                return webcrypto.subtle.verify(
                    {
                        name: ECC_WRITE_ALG,
                        hash: { name: DEFAULT_HASH_ALG }
                    },
                    pubKey,
                    utils.normalizeBase64ToBuf(sig),
                    utils.normalizeUnicodeToBuf(msg, DEFAULT_CHAR_SIZE)
                )
            })
            .then(isOk => {
                console.log('is ok?????', isOk)
                return isOk
            })
    }

    return webcrypto.subtle.verify(
        {
            name: ECC_WRITE_ALG,
            hash: { name: DEFAULT_HASH_ALG }
        },
        publicKey,
        utils.normalizeBase64ToBuf(sig),
        utils.normalizeUnicodeToBuf(msg, DEFAULT_CHAR_SIZE)
    )
}


async function sign (keys, msg) {
    const sig = await webcrypto.subtle.sign(
        {
            name: ECC_WRITE_ALG,
            hash: { name: DEFAULT_HASH_ALG }
        },
        keys.privateKey,
        utils.normalizeUnicodeToBuf(msg, DEFAULT_CHAR_SIZE)
    )

    return utils.arrBufToBase64(sig)
}

async function signObj (keys, hmac_key, obj) {
    if (!obj) {
        obj = hmac_key
        hmac_key = null
    }
    var _obj = clone(obj)
    const msgStr = stringify(_obj, null, 2)
    _obj.signature = await sign(keys, msgStr)
    return _obj
}
