const stripe = require('stripe')('sk_test_8n6qv7Bl3KjhZzdYhbwBCPnU00lo8hErSb');

exports.handler = async function (ev, ctx, cb) {
    var { subscriptionId } = JSON.parse(ev.body)

    var deletedSubscription = await stripe.subscriptions.del(subscriptionId)
    console.log('cancel subscription', deletedSubscription)

    cb(null, {
        statusCode: 200,
        body: JSON.stringify(deletedSubscription)
    })
}
