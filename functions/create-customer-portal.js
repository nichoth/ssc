// https://stripe.com/docs/billing/subscriptions/checkout/fixed-price#customer-portal

// Set your secret key. Remember to switch to your live secret key in production!
// See your keys here: https://dashboard.stripe.com/account/apikeys
const stripe = require('stripe')('sk_test_8n6qv7Bl3KjhZzdYhbwBCPnU00lo8hErSb')

exports.handler = async function (ev, ctx, cb) {
    var { sessionId } = JSON.parse(ev.body)
    var checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)
    const returnUrl = process.env.DOMAIN;

    const portalSession = await stripe.billingPortal.sessions.create({
        customer: checkoutSession.customer,
        return_url: returnUrl,
    })

    cb(null, {
        statusCode: 200,
        body: JSON.stringify({
            url: portalSession.url
        })
    })
}
