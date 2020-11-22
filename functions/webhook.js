const stripe = require('stripe')('sk_test_8n6qv7Bl3KjhZzdYhbwBCPnU00lo8hErSb')

exports.handler = function (ev, ctx, cb) {
    console.log('**ev**', ev)
    console.log('**ctx**', ctx)

    console.log('**parsed**', JSON.parse(ev.body))

    cb(null, {
        statusCode: 200,
        body: ''
    })

}

