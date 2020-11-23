# ssc

## stripe
[instructions for stripe checkout](https://stripe.com/docs/billing/subscriptions/checkout/fixed-price)

* Model your subscription with Products and Prices -- use the stripe dashboard
* Collect payment information and create the subscription with Stripe Checkout
* Integrate the customer portal to allow customers to manage their billing settings

### how it works
* create a 'checkout session' by calling our backend.
  - pass the price id, sucess-url, and cancel-url
  - get back a `sessionId`
* on the frontend, call `stripe.redirectToCheckout` with the `sessionId`
* for subscription management, get the `customerId` somehow, and create the 'portal session' in the backend, returning the prortal url to the frontend. Also pass a return url (a url to send the customer to when they are done with the portal)
```js
const portalsession = await stripe.billingPortal.sessions.create({
    customer: checkoutsession.customer,
    return_url: returnUrl,
});

res.send({
    url: portalsession.url,
});
```
* when you receive a `checkout.session.completed` webhook event, you should provision the subscription
* also listen for webhook events to cancel a subscription

-------------------------------------------

### how to check the subscription status
When you make a call to replicate, how do you know if it is paid for?


-----------------------------------------

## stripe test cards
* 4242 4242 4242 4242, any three-digit CVC number, any expiration date in the
future, and any five-digit ZIP code -- Succeeds and immediately creates an active subscription.
* 4000002500003155 -- Requires authentication. `confirmCardPayment()` will trigger a modal asking for the customer to authenticate. Once the user confirms, the subscription will become active. See [manage payment authentication](https://stripe.com/docs/billing/subscriptions/fixed-price#manage-payment-authentication).
* 4000008260003178 -- Always fails with a decline code of insufficient_funds. See create subscription step on how to handle this server side.
* 4000000000000341 -- Succeeds when it initially attaches to Customer object, but fails on the first payment of a subscription with the payment_intent value of requires_payment_method. See the manage subscription payment failure step.



--------------------------------------------------

## fauna
Using the public key as the user ID returns an error. The ID must be numeric
```js
client.query(
    q.Create(q.Ref(q.Collection('users'), keys.public), {
        data: {
            userName: 'fooooo',
            keys
        }
    })
)
```

```
`{"errors":[{"position":["create","id"],"code":"invalid argument","description":"Number or numeric String expected, non-numeric 'zdbQUQ94Nzxkhguxgw0t/eDhAhxazv+v0DsElbQ0opI=.ed25519' provided."}]}`,
```

See [user authentication in fauna](https://docs.fauna.com/fauna/current/tutorials/authentication/user?lang=javascript)

[create users](https://docs.fauna.com/fauna/current/tutorials/authentication/user.html#create) -- the `credentials.password` field is special -- it is hashed

> When a new user signs up, we can create a new user document that contains their email address and password. More specifically, a BCrypt hash of the user’s password is stored; FaunaDB does not store credentials in plain text.

> When a user wants to login, they would provide their email address and password. Then we use the Login function to authenticate their access, and if valid, provide them with a token that they can use to access resources.

> A token only provides access according to the privileges granted by an [attribute-based access control (ABAC) role](https://docs.fauna.com/fauna/current/security/abac). 

This way security is at the DB layer, not just the applicatino level.

-------------------------------------------

https://docs.fauna.com/fauna/current/tutorials/authentication/user?lang=javascript#create-user-index -- note the
```
{ permissions: { read: 'public' } }
```

--------------------------------------------


Doing the netlify fauna addon
[indexes](https://docs.fauna.com/fauna/current/tutorials/indexes/)

https://docs.fauna.com/fauna/current/integrations/netlify.html

```
netlify addons:create fauna
```

------------------------------------------------

## How to store the secret key
You don't really want a secret to be in the database.

- use a different priv key & a same-as message with the local user
- don't use a priv key at all, just function as the current pubs do -- saving and replicating messages

--------------------------------------------------------

## How does auth0 work?
Auth0 vs the fauna login

* create an account with invite code
* when you use the invite, check payment $$$

https://auth0.com/blog/deploying-javascript-apps-part-2/

Need to re-make the "client app" and the backend so they use normal stuff like xhr calls. Should make another version of `sbot` that has different method implementations.

* could use a push/pull interface like git

----------------------------------------------

## 11-17-2020

[traditional replication](https://github.com/nichoth/eventual-gram-ssb#10-18-2020) calls `createHistoryStream({id, seq})` for every feed you are following

[`createHistoryStream` call in the wild](https://github.com/ssbc/ssb-replicate/blob/28d763ce2da79b870547b247eecff0fe56baf17c/legacy.js#L256)

[sbot.createWriteStream](https://github.com/ssbc/ssb-db#dbcreatewritestream-source) -- used in the replicate code above.
> A pull-stream sink that expects a stream of messages and calls `db.add` on each item, appending every valid message to the log.


-----------------------------------------------

doing this -- https://stripe.com/docs/billing/subscriptions/checkout/fixed-price

---------------------------------------------

## 11-20-2020
* [subscriptions with checkout](https://stripe.com/docs/billing/subscriptions/checkout/fixed-price)
* [subscriptions with elements](https://stripe.com/docs/billing/subscriptions/fixed-price)


--------------------------------------------------------


* Where does the `card` variable come from?
it was a naming error. You can see if you view [the full example](https://github.com/stripe-samples/subscription-use-cases/blob/master/fixed-price-subscriptions/client/vanillajs/script.js)

See https://stripe.com/docs/billing/subscriptions/fixed-price . Make a test
for each section. see the issue for tests

stripe demo site:
https://github.com/stripe/stripe-payments-demo
https://stripe-payments-demo.appspot.com/


https://stripe.com/docs/stripe-js


[the checkout tutorial](https://stripe.com/docs/billing/subscriptions/checkout/fixed-price). I haven't read this one


--------------------------------------------

## 22-21-2020
[stripe subscriptions](https://stripe.com/docs/billing/subscriptions/overview)

reading https://stripe.com/docs/billing/subscriptions/checkout/fixed-price -- the stripe-hosted checkout page

price id -- price_1HpPOxBnqQbRlIvQeMvblXi5

*function URL:*
/.netlify/functions/hello




