var curves = {};
curves.ed25519 = require("./sodium");

var isBuffer = Buffer.isBuffer;

var u = {
    toBuffer: function (buf) {
        if (buf == null) return buf;
        if (Buffer.isBuffer(buf)) return buf;
        var i = buf.indexOf(".");
        var start = exports.hasSigil(buf) ? 1 : 0;
        return Buffer.from(
            buf.substring(start, ~i ? i : buf.length),
            "base64"
        )
    },

    getTag: function getTag(string) {
        var i = string.indexOf('.')
        return string.substring(i + 1)
    }
}

exports.handler = function (ev, ctx, cb) {
    console.log('**ev**', ev)
    // console.log('**ctx**', ctx)
    // console.log('**parsed**', JSON.parse(ev.body))

    var msg = JSON.parse(ev.body)

    // need keys = { public, curve }
    // do a DB lookup for the keys for a feed
    // public key should be passed in the message

    // @TODO -- get `keys` object

    if (!msg || !verifyObj(keys, null, msg)) {
        // is invalid
        // 422 (Unprocessable Entity)
        return cb(null, {
            statusCode: 422,
            body: JSON.stringify({
                ok: false,
                error: 'invalid message',
                message: msg
            })
        })
    }

    // has been verified
    cb(null, {
        statusCode: 200,
        body: JSON.stringify({
            ok: true,
            message: msg
        })
    })
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
    if (isObject(sig))
        throw new Error("signature should be base64 string," +
            "did you mean verifyObj(public, signed_obj)"
    )
    return curves[getCurve(keys)].verify(
        u.toBuffer(keys.public || keys),
        u.toBuffer(sig),
        isBuffer(msg) ? msg : Buffer.from(msg)
    )
}

function isObject (o) {
    return typeof o === 'object'
}

function clone (obj) {
    var _obj = {}
    for (var k in obj) {
      if (Object.hasOwnProperty.call(obj, k)) _obj[k] = obj[k]
    }
    return _obj
}

function getCurve (keys) {
    var curve = keys.curve
    if (!keys.curve && isString(keys.public)) keys = keys.public
    if (!curve && isString(keys)) curve = u.getTag(keys)
  
    if (!curves[curve]) {
        throw new Error(
            "unkown curve:" + curve + " expected: " + Object.keys(curves)
        )
    }
  
    return curve
}

