const stripe = require('stripe')('sk_test_8n6qv7Bl3KjhZzdYhbwBCPnU00lo8hErSb')

exports.handler = async function (ev, ctx, cb) {
    var { customerId, paymentMethodId, invoiceId } = JSON.parse(ev.body)

    try {
        await stripe.paymentMethods.attach(paymentMethodId, {
            customer: customerId
        })
        await stripe.customers.update(customerId, {
            invoice_settings: {
                default_payment_method: paymentMethodId
            }
        })
    } catch (error) {
        console.log('errrr', error)
        return cb(null, {
            statusCode: 402,
            body: JSON.stringify({
                error: { message: error.message }
            })
        })
    }

    const invoice = await stripe.invoices.retrieve(invoiceId, {
        expand: ['payment_intent'],
    })

    cb(null, {
        statusCode: 200,
        body: JSON.stringify(invoice)
    })
}

