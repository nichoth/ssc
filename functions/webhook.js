const stripe = require('stripe')('sk_test_8n6qv7Bl3KjhZzdYhbwBCPnU00lo8hErSb')

exports.handler = function (ev, ctx, cb) {
    console.log('**ev**', ev)
    console.log('**ctx**', ctx)
    console.log('**parsed**', JSON.parse(ev.body))


    let eventType;
    let event;
    // Check if webhook signing is configured.
    // const webhookSecret = {{'STRIPE_WEBHOOK_SECRET'}}
    if (webhookSecret) {
        // Retrieve the event by verifying the signature using the raw
        // body and secret.
        let signature = ev.headers['stripe-signature']

        try {
            event = stripe.webhooks.constructEvent(
                ev.body,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } catch (err) {
            console.log(`⚠️  Webhook signature verification failed.`, err)
            return res.sendStatus(400);
        }
        // Extract the object from the event.
        // data = event.data;
        eventType = event.type
    } else {
        // Webhook signing is recommended, but if the secret is not
        // configured in `config.js`,
        // retrieve the event data directly from the request body.
        event = JSON.parse(ev.body)
        eventType = JSON.parse(ev.body).type
    }

    switch (event.type) {
        case 'checkout.session.completed':
            // Payment is successful and the subscription is created.
            // You should provision the subscription.
            break;
        case 'invoice.paid':
            // Continue to provision the subscription as payments continue to be made.
            // Store the status in your database and check when a user accesses your service.
            // This approach helps you avoid hitting rate limits.
            break;
        case 'invoice.payment_failed':
            // The payment failed or the customer does not have a valid payment method.
            // The subscription becomes past_due. Notify your customer and send them to the
            // customer portal to update their payment information.
            break;
        default:
            // Unhandled event type
    }

    cb(null, {
        statusCode: 200,
        body: ''
    })

}

