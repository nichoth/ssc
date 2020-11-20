const stripe = require('stripe')('sk_test_8n6qv7Bl3KjhZzdYhbwBCPnU00lo8hErSb')

exports.handler = async function (ev, ctx, cb) {
    console.log('ev', ev)
    console.log('ctx', ctx)

    var { email } = JSON.parse(ev.body)
    const customer = await stripe.customers.create({ email });

    // TODO
    // store the customer in our database

    cb(null, {
        statusCode: 200,
        body: JSON.stringify({
            ok: true
        })
    })
}
