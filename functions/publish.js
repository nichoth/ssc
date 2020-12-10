var ssc = require('../')

// requests are like
// { keys: { public }, msg: {} }

exports.handler = function (ev, ctx, cb) {
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


    // @TODO
    // need to lookup the previous message to make sure the new
    // message contains its hash
    // see https://github.com/ssb-js/ssb-validate/blob/main/index.js#L149
    // here state.id is the hash of the prev msg, and `msg` is the current

    var isValid 
    try {
        isValid = ssc.verifyObj(keys, null, msg)
    } catch (err) {
        return cb(null, {
            statusCode: 422,
            body: JSON.stringify({
                ok: false,
                error: err,
                message: msg
            })
        })
    }

    if (!msg || !isValid) {
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
