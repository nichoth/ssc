import utils from "keystore-idb/lib/utils.js"
import * as uint8arrays from "uint8arrays"

const EDWARDS_DID_PREFIX = new Uint8Array([ 0xed, 0x01 ])
const BLS_DID_PREFIX = new Uint8Array([ 0xea, 0x01 ])
const RSA_DID_PREFIX = new Uint8Array([ 0x00, 0xf5, 0x02 ])
const BASE58_DID_PREFIX = "did:key:z"

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

const KeyType = {
    RSA: "rsa",
    Edwards: "ed25519",
    BLS: "bls12-381"
}

/**
 * Convert a DID (did:key) to the public key in bytes
 */
function didToPublicKeyBytes(did) {
    if (!did.startsWith(BASE58_DID_PREFIX)) {
        throw new Error("Please use a base58-encoded DID formatted `did:key:z...`")
    }

    const didWithoutPrefix = did.slice(BASE58_DID_PREFIX.length)
    const magicBytes = uint8arrays.fromString(didWithoutPrefix, "base58btc")
    const { keyBytes, type } = parseMagicBytes(magicBytes)

    return {
        publicKey: keyBytes,
        type
    }
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
    publicKeyToDid,
    didToPublicKeyBytes
}

