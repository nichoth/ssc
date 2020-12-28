# ssc
Completely generic functions for working with a merkle-dag.

This is `ssb` but more boring. `ssc` because c comes after b in the alphabet

-------------------------------------------------------

## install
```
npm i @nichoth/ssc
```

------------------------------------

## example

### create a message
```js
var ssc = require('@nichoth/ssc')
var ssbKeys = require("ssb-keys")
var keys = ssbKeys.generate()
var content = { type: 'test', text: 'woooo' }

// this create a root message (no ancestors in the merkle list)
// (keys, prevMsg, content)
var msg = ssc.createMsg(keys, null, content)

// pass in prev msg to create the merkle-list
var msg2 = ssc.createMsg(keys, msg, content)
```

### validate a message
This check that the signature and public key are ok together.

```js
// keys = { public }
var msgIsOk = ssc.verifyObj(keys, null, msg)
// true
```

### create another message
The new message contains the previous message's hash

```js
var content2 = { type: 'test2', text: 'ok' }
// we pass in the original msg here
var msg2 = ssc.createMsg(keys, msg, content2)
(msg2.previous === ssc.getId(msg))
// => true 
```

### isValidMsg
This check that the message contains the hash of `prevMsg`, and also
makes sure the signature matches the public key.

```js
test('isValidMsg', function (t) {
    t.plan(2)
    var msg = ssc.createMsg(keys, null, { type: 'test', text: 'ok' })
    var msg2 = ssc.createMsg(keys, msg, { type: 'test', text: 'ok' })
    var isValid = ssc.isValidMsg(msg2, msg, keys)
    // => true

    var badMsg = ssc.createMsg(keys, null, { type: 'test', text: 'ok' })
    var isOkPrev = ssc.isValidMsg(badMsg, msg2, keys)
    // => false
    // we pass in null as the prevMsg, but validate with msg2 as prev
})
```





---------------------------------------------------------


## 11-17-2020

[traditional replication](https://github.com/nichoth/eventual-gram-ssb#10-18-2020) calls `createHistoryStream({id, seq})` for every feed you are following

[`createHistoryStream` call in the wild](https://github.com/ssbc/ssb-replicate/blob/28d763ce2da79b870547b247eecff0fe56baf17c/legacy.js#L256)

[sbot.createWriteStream](https://github.com/ssbc/ssb-db#dbcreatewritestream-source) -- used in the replicate code above.
> A pull-stream sink that expects a stream of messages and calls `db.add` on each item, appending every valid message to the log.


-----------------------------------------------

doing this -- https://stripe.com/docs/billing/subscriptions/checkout/fixed-price

---------------------------------------------


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
{
    "key":"%32430gJSyyUgtFXC+SbN28lQAImdhF+QNCMHdWA0g1s=.sha256",
    "value": {
        "previous": "%MlfqQwx2JB0+I1fmKXs/0YFHd1ByCG2YxrzG6aNvBLU=.sha256",
        "sequence":3,
        "author":"@MauI+NQ1dOg4Eo5NPs4OKxVQgWXMjlp5pjQ87CdRJtQ=.ed25519",
        "timestamp":1552173261043,
        "hash":"sha256",
        "content": {
            "type":"about",
            "about":"@MauI+NQ1dOg4Eo5NPs4OKxVQgWXMjlp5pjQ87CdRJtQ=.ed25519",
            "name":"SSB PeerNet USW"
        },
        "signature":"nTvZNy7DrIpMKWNXthzVMvXPqrnwftG5vW9kqQtUXt71UyDCYCJAQRIeYWEpY/57Xx/1DPFcXCXx1RiNF0hLBQ==.sig.ed25519"
    },
    "timestamp":1579905060637
}
```

[check for the prev hash](https://github.com/ssb-js/ssb-validate/blob/main/index.js#L149)

we check explicitly that `msg.previous === state.id` (the prev message keys are equal, in the queue and the new message),
then check that the signature is valid by passing the message, the keys, and signature to `ssb-keys.verify`

since the previous msg hash is in the next msg, you know it is valid


--------------------------------------------------------

## 10-8-2020

`sodium` takes the message and sig to verify
(deletes the sig before verifying)

https://github.com/ssb-js/ssb-keys/blob/2342a85c5bd4a1cf8739b7b09eb2f667f735bd08/sodium.js#L28




I think the message that is validated is everything from the 'value' level,
but without the signature:

https://github.com/ssb-js/ssb-keys/blob/main/index.js#L126

You can't include the hash in the object to be hashed.


---------------------------------------------------------

## 12-15-2020

`exports.id`
https://github.com/ssb-js/ssb-validate/blob/main/index.js#L339




[check for the prev hash](https://github.com/ssb-js/ssb-validate/blob/main/index.js#L149)

here we would check the given prevID against the one in the DB





