exports.handler = function (ev, ctx, cb) {
    console.log('**ev**', ev)

    cb(null, {
        statusCode: 200,
        body: JSON.stringify({ ok: 'true' })
    })
}
