import { createRequire } from 'module';
const require = createRequire(import.meta.url);

var timestamp = require('monotonic-timestamp')
var ssbKeys = require('ssb-keys')
var stringify = require('json-stable-stringify')
import { clone, isObject, getId, hash, isInvalidShape } from './util.js'
import { webcrypto } from 'one-webcrypto'
import { ECC_WRITE_ALG, DEFAULT_HASH_ALG,
    DEFAULT_CHAR_SIZE } from './CONSTANTS.js'
import * as utils from 'keystore-idb/lib/utils.js'

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
    publicKeyToId
}

function createKeys () {
    const uses = ['sign', 'verify']

    return webcrypto.subtle.generateKey({
        name:  ECC_WRITE_ALG,
        namedCurve: 'P-256'
    }, false, uses)
        .then(key => {
            return publicKeyToId(key)
                .then(id => {
                    return { id, keys: key }
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



// just creates a msg, doesn't check that the `msg.previous` key is valid
async function createMsg (keys, prevMsg, content) {
    if (!isObject(content) && !isEncrypted(content)) {
        throw new Error('invalid message content, ' +
            'must be object or encrypted string')
    }

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
    const raw = await webcrypto.subtle.exportKey('raw', keypair.publicKey)
    const str = utils.arrBufToBase64(raw)
    return '@' + str + '.' + KEY_TYPE
}


function verifyObj (keys, hmac_key, obj) {
    if (!obj) (obj = hmac_key), (hmac_key = null);
    obj = clone(obj);
    var sig = obj.signature;
    delete obj.signature;
    return verify(keys, sig, stringify(obj))
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

    return webcrypto.subtle.verify(
        {
            name: ECC_WRITE_ALG,
            hash: { name: DEFAULT_HASH_ALG }
        },
        keys.publicKey,
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
