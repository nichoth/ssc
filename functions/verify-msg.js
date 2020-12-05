var curves = {}
curves.ed25519 = require("./sodium")

//takes a public key, signature, and a hash
//and returns true if the signature was valid.
function verify (keys, sig, msg) {
    if (isObject(sig))
        throw new Error(
        'signature should be base64 string,' +
            'did you mean verifyObj(public, signed_obj)'
        );
    return curves[getCurve(keys)].verify(
        u.toBuffer(keys.public || keys),
        u.toBuffer(sig),
        isBuffer(msg) ? msg : Buffer.from(msg)
    )
}
