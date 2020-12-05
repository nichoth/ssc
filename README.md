# ssc

`ssc` because c comes after b in the alphabet

This is `ssb` but more boring


-------------------------------------------------------


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


--------------------------------------------------------

## 11-23-2020
You can't use directories in netlify functions

Need to be able to download messages

### how to do auth on the replicate call?
https://gomakethings.com/using-oauth-with-fetch-in-vanilla-js/

First get an oauth token by calling with your key and secret, then use an `Authorirization` header in the fetch call to replicate. The header contains the oauth token.

`createHistoryStream`
request
```js
{
    pubKey: myLatestSequenceNumber,
    pubKey2: latestNumber
}
```

response
```js
{
    pubKey: [ latest + 1, latest+2... ]
}
```

msg
```js
{
    "key":"%SPzeq9OdZWh4X/4tIPpaYa61jU87Yw5lwBC0MwLI9dA=.sha256",
    "value":{
        "previous":null,
        "sequence":1,
        "author":"@RPFLJtoWjcQyYC51lEUxm4brAyE6Okln8LGeh4Z7sVw=.ed25519",
        "timestamp":1579904787188,
        "hash":"sha256",
        "content":{"type":"about",
            "about":"@RPFLJtoWjcQyYC51lEUxm4brAyE6Okln8LGeh4Z7sVw=.ed25519",
            "image":"&vczwtGvZMt12nSSJ0BiBgYRNF5tOI3rjI/CCXMDIjHU=.sha256",
            "name":"nichoth"
        },
        "signature": "CfDTwh0OjrUGaiVHcyrT0ZhRDLYQKhYFEQfKNbQWfMiMrJC" +
            "gwoxLjldQm0fbBBPPvC8Y7288N/WQCZVt6JWSBA==.sig.ed25519"
    },
    "timestamp":1579904787189
}
```

msg 2
```js
{
    key '...',
    value: {
        previous: '%SPzeq9OdZWh4X/4tIPpaYa61jU87Yw5lwBC0MwLI9dA=.sha256',
        sequence: 2
        // ...
    }
}
```

---------------------------------------------------------

## 11-24-2020
example
should have `data: { userName: '', publicKey: '', curve: '' }`
no private key

```js
{
    "ref": Ref(Collection("users"), "282415672351261196"),
    "ts": 1605591423320000,
    "data": {
        "userName": "fooooo",
        "secrets": {
            "curve": "ed25519",
            "public": "zhyS3C1K1ixjBSIy9ezwAbsI877ol61uza8fnP8RFXk=.ed25519",
            "private": "SFg85EiJLHspP5HsTONBuJ3+4NRmZ5E7JlOndO2SUhLOHJLcLUrWLGMFIjL17PABuwjzvuiXrW7Nrx+c/xEVeQ==.ed25519",
            "id": "@zhyS3C1K1ixjBSIy9ezwAbsI877ol61uza8fnP8RFXk=.ed25519"
        }
    }
}
```

How to store private key?

------------------------------------------------------

https://developers.yubico.com/U2F/Libraries/Using_a_library.html


## 11-27-2020
* should have the equivalent of `.publish` and `.createHistoryStream`

`flume-db` includes nothing for replication it seems. That is done in `ssb-db` and `ssb-server`.

Could try it with a synchronizing DB -- like `flumelog-idb`. 

Need to check the signatures on the server.


---------------------------------------------------


## 11-28-2020
Need to make and endpoint for `.publish`

* start with doing it in-memory, no writing to disk

* server should verify the `.publish(msg)` calls are correct. (it can validate messages but not sign them)


---------------------------------------------------

https://github.com/ssb-js/ssb-validate

message
```js
{
    previous: null,
    sequence: 1,
    author: '@vYAqxqmL4/WDSoHjg54LUJRN4EH9/I4A/OFrMpXIWkQ=.ed25519',
    timestamp: 1606692151952,
    hash: 'sha256',
    content: { type: 'test', text: 'woooo' },
    signature: 'wHdXRQBt8k0rFEa9ym35pNqmeHwA+kTTdOC3N6wAn4yOb6dsfIq/X0JpHCBZVJcw6Luo6uH1udpq12I4eYzBAw==.sig.ed25519'
}
```


https://github.com/ssbc/ssb-db/blob/master/index.js
https://github.com/ssbc/ssb-db/blob/788cd5c5d067b3bc90949337d8387ba1b0151276/create.js
https://github.com/ssbc/ssb-db/blob/788cd5c5d067b3bc90949337d8387ba1b0151276/minimal.js

`publish` =>                                                     `db = Flume()`
`db.add` => `db.queue` => `v.append(state, hmacKey, message)` => `db.append` =>
`v.create`, `queue(msg)`

---------------------------------------------------------


## 11-30-2020
Make a `publish` endpoint
* should validate the message server-side
* pass your public key and the message itself
* how to validate on server? --
`checkInvalid(state, hmac_key, msg)`

https://github.com/ssb-js/ssb-validate/blob/main/index.js#L167
```js
if(!ssbKeys.verifyObj({public: msg.author.substring(1)}, hmac_key, msg))
```
[ssb-keys verify obj](https://github.com/ssb-js/ssb-keys#verifyobjkeys-hmac_key-obj)


--------------------------------------------------------------------


comes down to `sodium.verify`
[sodium.verify](https://github.com/ssb-js/ssb-keys/blob/main/index.js#L104)

but where does the previous signature come in? I guess it's a part of the current message, so that works

the `initial` state
```
init { validated: 0, queued: 0, queue: [], feeds: {}, error: null }
```

we check explicitly that `msg.previous === state.id`
that the prev hash equals our recorded prev hash
https://github.com/ssb-js/ssb-validate/blob/main/index.js#L149


[checkInvalidCheap](https://github.com/ssb-js/ssb-validate/blob/main/index.js#L134)

i think here `state` is a unique object (not related to other instances). 

`state` in `checkInvalid` is a particular feed
```js
state.error = exports.checkInvalidCheap(flatState(state.feeds[msg.author]), msg)
```

```js
// state is
{ id, sequence, timestamp }
flatState(state.feeds[msg.author])
```

`state.id` is the hash of the prev msg

this is where items are added to `state.feeds`: 
https://github.com/ssb-js/ssb-validate/blob/main/index.js#L200
```js
state.feeds[msg.author].queue.push(exports.toKeyValueTimestamp(msg))
```

`toKeyValueTimestamp`:
https://github.com/ssb-js/ssb-validate/blob/main/index.js#L200
```js
exports.toKeyValueTimestamp = function (msg, id) {
    // this is where `key` comes from in the message
  return {
    key: id ? id : exports.id(msg),
    value: msg,
    timestamp: timestamp()
  }
}
```

`exports.id`:
```js
exports.id = function (msg) {
  return '%'+ssbKeys.hash(JSON.stringify(msg, null, 2))
}
```

from the log
```js
{
    "key": "%SPzeq9OdZWh4X/4tIPpaYa61jU87Yw5lwBC0MwLI9dA=.sha256",
    "value":{
        "previous":null,
        "sequence":1,
        "author":"@RPFLJtoWjcQyYC51lEUxm4brAyE6Okln8LGeh4Z7sVw=.ed25519",
        "timestamp":1579904787188,
        "hash":"sha256",
        "content": {
            "type":"about",
            "about":"@RPFLJtoWjcQyYC51lEUxm4brAyE6Okln8LGeh4Z7sVw=.ed25519",
            "image":"&vczwtGvZMt12nSSJ0BiBgYRNF5tOI3rjI/CCXMDIjHU=.sha256",
            "name":"nichoth"
        }, 
        "signature":"CfDTwh0OjrUGaiVHcyrT0ZhRDLYQKhYFEQfKNbQWfMiMrJCgwoxLjldQm0fbBBPPvC8Y7288N/WQCZVt6JWSBA==.sig.ed25519"
    },
    "timestamp":1579904787189
}
```


we check explicitly that `msg.previous === state.id` (the prev message keys are equal, in the queue and the new message),
then check that the signature is valid by passing the message, the keys, and signature to `ssb-keys.verify`







