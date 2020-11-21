// Set your secret key. Remember to switch to your live secret key in production!
// See your keys here: https://dashboard.stripe.com/account/apikeys
const stripe = require('stripe')('sk_test_8n6qv7Bl3KjhZzdYhbwBCPnU00lo8hErSb')

exports.handler = function (ev, ctx, cb) {
    var { customerId, paymentMethodId } = JSON.parse(ev.body)

    // Attach the payment method to the customer
    try {
        await stripe.paymentMethods.attach(req.body.paymentMethodId, {
            customer: customerId
        });
    } catch (error) {
        return cb(null, {
            statusCode: 402,
            body: JSON.stringify({ error: { message: error.message } })
        })
    }

    // Change the default invoice settings on the customer to the new
    // payment method
    await stripe.customers.update(customerId, {
        invoice_settings: {
            default_payment_method: paymentMethodId
        }
    })

    const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: 'price_HGd7M3DV3IMXkC' }],
        expand: ['latest_invoice.payment_intent'],
    })

    cb(null, {
        statusCode: 200,
        body: JSON.stringify(subscription)
    })
}
