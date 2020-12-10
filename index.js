var sodium = require("chloride")
var hmac = sodium.crypto_auth
var curve = require('./sodium')

module.exports = {
    verifyObj: verifyObj
}

// see https://github.com/ssb-js/ssb-keys/blob/main/index.js#L113 and
// https://github.com/ssb-js/ssb-validate/blob/main/index.js#L317

// need to implement `checkInvalidCheap`
// https://github.com/ssb-js/ssb-validate/blob/main/index.js#L134

// here is where the calls start
// https://github.com/ssb-js/ssb-validate/blob/main/index.js#L167
// first `checkInvalidCheap`, then `verifyObj`
// `checkInvalidCheap` is where we check that the prev/next msgs have the
// right keys

function hasSigil (s) {
    return /^(@|%|&)/.test(s);
}

var u = {
    toBuffer: function (buf) {
        if (buf == null) return buf;
        if (Buffer.isBuffer(buf)) return buf;
        var i = buf.indexOf(".");
        var start = hasSigil(buf) ? 1 : 0;
        return Buffer.from(
            buf.substring(start, ~i ? i : buf.length),
            "base64"
        )
    }
}

function verifyObj (keys, hmac_key, obj) {
    if (!obj) (obj = hmac_key), (hmac_key = null);
    obj = clone(obj);
    var sig = obj.signature;
    delete obj.signature;
    var b = Buffer.from(JSON.stringify(obj, null, 2));
    if (hmac_key) b = hmac(b, u.toBuffer(hmac_key));
    return verify(keys, sig, b);
}

// takes a public key, signature, and a hash
// and returns true if the signature was valid.
function verify (keys, sig, msg) {
    if (typeof sig === 'object') {
        throw new Error('signature should be base64 string,' +
            'did you mean verifyObj(public, signed_obj)')
    }

    return curve.verify(
        u.toBuffer(keys.public || keys),
        u.toBuffer(sig),
        Buffer.isBuffer(msg) ? msg : Buffer.from(msg)
    )
}

function clone(obj) {
    var _obj = {}
    for (var k in obj) {
      if (Object.hasOwnProperty.call(obj, k)) _obj[k] = obj[k]
    }
    return _obj
}
