// Set your secret key. Remember to switch to your live secret key in production!
// See your keys here: https://dashboard.stripe.com/account/apikeys
const stripe = require('stripe')('sk_test_8n6qv7Bl3KjhZzdYhbwBCPnU00lo8hErSb')

exports.handler = async function (ev, ctx, cb) {
    var sessionId = ev.queryStringParameters.sessionId
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    cb(null, {
        statusCode: 200,
        body: JSON.stringify(session)
    })
}
