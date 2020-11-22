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

// app.post('/customer-portal', async (req, res) => {
//     // For demonstration purposes, we're using the Checkout session to retrieve the customer ID.
//     // Typically this is stored alongside the authenticated user in your database.
//     const { sessionId } = req.body;
//     const checkoutsession = await stripe.checkout.sessions.retrieve(sessionId);

//     // This is the url to which the customer will be redirected when they are done
//     // managign their billing with the portal.
//     const returnUrl = process.env.DOMAIN;

//     const portalsession = await stripe.billingPortal.sessions.create({
//       customer: checkoutsession.customer,
//       return_url: returnUrl,
//     });

//     res.send({
//       url: portalsession.url,
//     })
// })
