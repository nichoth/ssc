const { EccCurve } = require('./types')

module.exports = {
    ECC_WRITE_ALG: 'ECDSA',
    DEFAULT_HASH_ALG: 'SHA-256',
    DEFAULT_ECC_CURVE: EccCurve.P_256,
    hashAlg: {
        SHA_1: 'SHA-1',
        SHA_256: 'SHA-256',
        SHA_384: 'SHA-384',
        SHA_512: 'SHA-512'
    }
}
