exports.handler = async function (ev, ctx, cb) {
    var req = JSON.parse(ev.body)
    console.log('req', req)
    cb(null, {
        statusCode: 200,
        body: 'ok'
    })
}
