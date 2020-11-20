const stripe = require('stripe')('sk_test_8n6qv7Bl3KjhZzdYhbwBCPnU00lo8hErSb')

exports.handler = async function (ev, ctx, cb) {
    console.log('ev', ev)
    console.log('ctx', ctx)

    cb(null, {
        statusCode: 200,
        body: JSON.stringify({
            ok: true
        })
    })

}

