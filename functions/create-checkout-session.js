// https://stripe.com/docs/billing/subscriptions/checkout/fixed-price#create-session

const stripe = require('stripe')('sk_test_8n6qv7Bl3KjhZzdYhbwBCPnU00lo8hErSb')

exports.handler = async function (ev, ctx, cb) {
    // need to put the priceId in the frontend
    var { priceId } = JSON.parse(ev.body)
    console.log('price id', priceId)
    
    try {
        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            payment_method_types: ["card"],
            line_items: [{
                  price: priceId,
                  quantity: 1
            }],
            // {CHECKOUT_SESSION_ID} is a string literal; do not change it!
            // the actual Session ID is returned in the query parameter
            // when your customer is redirected to the success page.
            success_url: 'https://ssc-db.netlify.app/' +
                'success.html?session_id={CHECKOUT_SESSION_ID}',
            cancel_url: 'https://ssc-db.netlify.app/canceled.html'
        });

        cb(null, {
            statusCode: 200,
            body: JSON.stringify({
                sessionId: session.id
            })
        })
    } catch (err) {
        return cb(null, {
            statusCode: 400,
            body: JSON.stringify({
                error: { message: err.message }
            })
        })
    }
}
