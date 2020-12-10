exports.handler = function (ev, ctx, cb) {
    console.log('**ev**', ev)

    cb(null, {
        statusCode: 500,
        body: JSON.stringify({ ok: false })
    })
}
