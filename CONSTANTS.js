export const types = {
    KeyUse: {
        Exchange: 'exchange',
        Write: 'write'
    },

    EccCurve: {
        P_256: 'P-256',
        P_384: 'P-384',
        P_521: 'P-521'
    }
}

export const ECC_WRITE_ALG = 'ECDSA'
export const DEFAULT_HASH_ALG = 'SHA-256'
export const DEFAULT_ECC_CURVE = types.EccCurve.P_256
export const DEFAULT_CHAR_SIZE = 16
export const hashAlg = {
    SHA_1: 'SHA-1',
    SHA_256: 'SHA-256',
    SHA_384: 'SHA-384',
    SHA_512: 'SHA-512'
}
