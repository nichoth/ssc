var curve = require('./sodium')

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

// requests are like
// { keys: { public }, msg: {} }

exports.handler = function (ev, ctx, cb) {
    console.log('**ev**', ev)

    try {
        var { keys, msg } = JSON.parse(ev.body)
    } catch (err) {
        return cb(null, {
            statusCode: 422,
            body: JSON.stringify({
                ok: false,
                error: 'invalid json',
                message: err.message
            })
        })
    }

    console.log('**msg**', msg)
    console.log('**keys**', keys)

    // todo -- get public key from DB
    // we just need keys = { public: '' }
    // well no, i guess the public key should be in the message body,
    // so we don't need to do a DB lookup
    // need to lookup the previous message though, to make sure the new
    // message contains its hash

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

    // @TODO -- need to add the message to the DB
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

//takes a public key, signature, and a hash
//and returns true if the signature was valid.
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
