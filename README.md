# ssc
Static functions for working with a merkle-dag.

This is `ssb` but more boring. `ssc` because c comes after b in the alphabet

-------------------------------------------------------

## install
```
npm i @nichoth/ssc
```

------------------------------------

## use in a browser
This uses the [fission/webnative](https://github.com/fission-suite/keystore-idb) modules to create a key pair using the [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API). It uses a different source module — `/web` — than the standard, node-compatible API.


### UCAN
UCANs are a merkle-list of signed objects for user permissions. 

You call the `wn.ucan.build` method:

```js
wn.ucan.build({
    audience: otherDID,
    issuer: ourDID,
    // `facts` can be used for arbitrary data
    // facts: [],
    lifetimeInSeconds: 60 * 60 * 24, // UCAN expires in 24 hours
    // `potency` is used by our application
    potency: 'APPEND_ONLY',
    proof: possibleProof
})
    .then((ucan) => {})

```




-------------------------------------------------------------------


### Example using the Web Crypto API

```js
var ssc = require('@nichoth/ssc/web')
var test = require('tape')

var ks
test('create keys', async t => {
    ks = await ssc.createKeys()
    t.ok(ks, 'should return a keystore')
    t.end()
})

test('sign and validate something', async t => {
    var sig = await ks.sign('my message')
    t.ok(sig, 'should sign a message')
    const publicKey = await ks.publicWriteKey()
    var isValid = await ks.verify('my message', sig, publicKey)
    t.equal(isValid, true, 'should be a valid signature')
})

var msg
test('create a message', async t => {
    var content = { type: 'test', text: 'woooo' }
    msg = await ssc.createMsg(ks, null, content)
    t.ok(msg, 'should create a message')
    t.ok(msg.author, 'should have the message author')
    t.equal(msg.content.type, 'test', 'should have the message content')
    t.ok(msg.signature, 'should have the message signature')
    t.end()
})

// This checks that the signature and given public key are valid
test('verify a message', async t => {
    var msgIsOk = await ssc.verifyObj(ks, msg)
    t.equal(msgIsOk, true, 'should return true for a valid message')
    t.end()
})

// this checks the merkle-ness, in addition to the signature being valid
test('is valid message', async t => {
    // (msg, prevMsg, keys)
    var isValid = await ssc.isValidMsg(msg, null, ks)
    t.plan(1)
    t.equal(isValid, true, 'should return true for valid message')
})

var msg2
test('create a second message', async t => {
    t.plan(1)
    var content2 = { type: 'test2', text: 'ok' }
    // we pass in the original msg here
    msg2 = await ssc.createMsg(ks, msg, content2)
    t.ok(msg2.previous === ssc.getId(msg), 
        'should create `prev` as prev msg hash')
    // => true 
})

// check that the message contains the hash of prevMsg, and also makes sure
// the signature is valid
test('validate the second message', async t => {
    // (msg, prevMsg, keys)
    var isValid = await ssc.isValidMsg(msg2, msg, ks)
    t.equal(isValid, true, 'should validate a message with a previous hash')
    t.end()
})

// this works but is kind of confusing because of the use of promises &
// async functions. I should re-do this
test('create a merkle list', async t => {
    t.plan(2)
    var arr = ['one', 'two', 'three']
    var list = await arr.reduce(async function (acc, val) {
        return acc.then(async res => {
            var prev = res[res.length - 1]
            if (!res[res.length - 1]) prev = null
            return ssc.createMsg(ks, prev, { type: 'test', text: val })
                .then(result => {
                    res.push(result)
                    return res
                })
        })
    }, Promise.resolve([]))

    t.equal(list.length, 3, 'should create the right number of list items')

    var isValidList = await list.reduce(async function (isValid, msg, i) {
        var prev = list[i - 1] || null
        // ssc.isValidMsg(msg2, msg, keys)
        return isValid && await ssc.isValidMsg(msg, prev, ks)
    }, true)

    t.equal(isValidList, true, 'reduced validation should be ok')
})

```


---------------------------------------------------------------------


## examples using the old node/browser API

### sign
Sign a string with a given private key

```js
var ssc = require('@nichoth/ssc')
var test = require('tape')

var _keys
var sig
test('sign a string', function (t) {
    _keys = ssc.createKeys()
    // _keys here is an object with `.private`, or just a key you want to use
    // `{ private: '123' }` or just `123`
    var signature = sig = ssc.sign(_keys, 'a test message')
    t.ok(signature, 'should return a signature')
    t.equal(typeof signature, 'string', 'should return a string')
    t.end()
})
```

## verify a signature
Verify a signature with a given public key. `_keys` here should have 
`.public` or can be just a public key: `{ public: 123 }` or `123`

```js
test('verify a signature', t => {
    var isValid = ssc.verify(_keys, sig, 'a test message')
    t.equal(isValid, true, 'signature verification should work')
    t.end()
})
```

### getId

Get the id for a message (the id is the hash of the message)

```js
var ssc = require('@nichoth/ssc')
var keys = ssc.createKeys()
var prev = null

var msg = ssc.createMsg(keys, prev, {
    type: 'test',
    text: 'ok world'
})

var key = ssc.getId(msg),
```

### generate
```js
var crypto = require('crypto')
var ssc = require('@nichoth/ssc')

var seed = crypto.randomBytes(32)
var keyCap = ssc.generate('ed25519', seed)

// => {
// curve: 'ed25519',
// public: 'U6VgAlPvnSwWs/jocgEOrWjqEPJn6k7RXXog7/jC5zU=.ed25519',
// private: '6iZUnNvLyQHAPobLNA33aavUaljEt06wfuff1iXb9d5TpWACU++dLBaz+OhyAQ6taOoQ8mfqTtFdeiDv+MLnNQ==.ed25519',
// id: '@U6VgAlPvnSwWs/jocgEOrWjqEPJn6k7RXXog7/jC5zU=.ed25519'
// }
```

### create a key pair
```js
var ssc = require('@nichoth/ssc')
var keys = ssc.createKeys()
console.log(keys)

// {
//   curve: 'ed25519',
//   public: 'd4xotrRAG+l17+r/xXGT1IgHfEzO8fC+5uy/KfFhA0w=.ed25519',
//   private: 'ns00cIhaZcZjEdb8vcuEiQ1DyTcfNnuePJBEnnyLqaJ3jGi2tEAb6XXv6v/FcZPUiAd8TM7x8L7m7L8p8WEDTA==.ed25519',
//   id: '@d4xotrRAG+l17+r/xXGT1IgHfEzO8fC+5uy/KfFhA0w=.ed25519'
// }

```

### create a message
```js
var ssc = require('@nichoth/ssc')
var keys = ssc.createKeys()
var content = { type: 'test', text: 'woooo' }

// this creates a root message (no ancestors in the merkle list)
// (keys, prevMsg, content)
var msg = ssc.createMsg(keys, null, content)

    // => msg:
    //   {
    //     previous: null,
    //     sequence: 1,
    //     author: '@IGrkmx/GjfzaOLNjTpdmmPWuTj5xeSv/2pCP+yUI8eo=.ed25519',
    //     timestamp: 1608054728047,
    //     hash: 'sha256',
    //     content: { type: 'test', text: 'woooo' },
    //     signature: 'LJUQXvR6SZ9lQSlF1w1RFQi3GFIU4B/Cc1sP6kjxnMZn3YW8X7nj9/hlWiTF3cJbWkc9xHvApJ+9uRtHxicXAQ==.sig.ed25519'
    //   }

// pass in prev msg to create the merkle-list
var msg2 = ssc.createMsg(keys, msg, content)
```

### verify a message
This checks that the signature and public key are ok together.

```js
var ssc = require('@nichoth/ssc')

// keys = { public }
// function verifyObj (keys, hmac_key, obj)
var msgIsOk = ssc.verifyObj(keys, null, msg)
// true
```

### create another message
The new message contains the previous message's hash, and is signed by the
message author

```js
var ssc = require('@nichoth/ssc')

var content2 = { type: 'test2', text: 'ok' }
// we pass in the original msg here
var msg2 = ssc.createMsg(keys, msg, content2)
(msg2.previous === ssc.getId(msg))
// => true 
```

### isValidMsg
This checks that the message contains the hash of `prevMsg`, and also
makes sure the signature is valid.

```js
var ssc = require('@nichoth/ssc')

var msg = ssc.createMsg(keys, null, { type: 'test', text: 'ok' })
var msg2 = ssc.createMsg(keys, msg, { type: 'test', text: 'ok' })

// (msg, prevMsg, keys)
var isValid = ssc.isValidMsg(msg2, msg, keys)
// => true

var badMsg = ssc.createMsg(keys, null, { type: 'test', text: 'ok' })
var isOk = ssc.isValidMsg(badMsg, msg2, keys)
// => false
// we pass in null as the prevMsg, but validate with msg2 as prev
```

### Create a merkle list from an array

```js
var ssc = require('@nichoth/ssc')
var keys = ssc.createKeys()

test('create a merkle list', function (t) {
    t.plan(2)
    var arr = ['one', 'two', 'three']
    var list = arr.reduce(function (acc, val) {
        var prev = (acc[acc.length - 1] || null)
        var msg = ssc.createMsg(keys, prev, {
            type: 'test',
            text: val
        })
        acc.push(msg)
        return acc
    }, [])

    t.equal(list.length, 3, 'should create a merkle list')

    var isValidList = list.reduce(function (isValid, msg, i) {
        var prev = list[i - 1] || null
        // ssc.isValidMsg(msg2, msg, keys)
        return isValid && ssc.isValidMsg(msg, prev, keys)
    }, true)

    t.equal(isValidList, true, 'reduced validation should be ok')
})
```

## hash
Get the hash of a string or buffer
```js
var ssc = require('@nichoth/ssc')

var hash = ssc.hash('a string to hash')
// 'GHx6bNkCvFIPAwFVUNc1qOJPAPiIwDKMm2vL0tfJDPc=.sha256'
```

### create ssb style post messages
```js
// messages have { key, value }
var ssc = require('@nichoth/ssc')

test('create ssb style posts', function (t) {
    t.plan(3)

    var arr = ['one', 'two', 'three']
    var list = arr.reduce(function (acc, val) {
        var prev = (acc[acc.length - 1] || null)
        // need to use the `.value` key in this case
        prev = prev === null ? prev : prev.value
        var msg = ssc.createMsg(keys, prev, {
            type: 'test',
            text: val
        })
        acc.push({
            key: ssc.getId(msg),
            value: msg
        })
        return acc
    }, [])


    t.ok(list[0].key, 'should have `.key`')
    t.ok(ssc.verifyObj(keys, null, list[0].value),
        'msg should have valid .value')
    t.equal(list[0].value.content.text, 'one',
        'should have the right content at the right key')
    t.equal(list[0].key[0], '%', 'should have the right format id')
})
```

### Get the hash of something
```js
var ssc = require('@nichoth/ssc')

function getMessageId (msg) {
    return '%' + ssc.hash(JSON.stringify(msg, null, 2))
}
```

-----------------------------------


## notes

ssb format is `{ key: '...', value: msg }`. I think this is just used for storing in the DB though, where key is the hash or something of the message.

----------------------------------

```js
// ssb style post
// {
//  key: '%uS0xrYDtij+ukWHir98G8cdCo8sgGDp4t2HoBWUYl3Q=.sha256',
//  value: {
//    previous: '%Qh2prm1RsxOjYSb0Qp9KNFjp641sL4MJGfnd8jAE3N8=.sha256',
//    sequence: 3,
//    author: '@FppHFxGG2TO2HqLGVad1VIwcFlTu9okR5qqj5ejGXFk=.ed25519',
//    timestamp: 1586138755567,
//    hash: 'sha256',
//    content: { type: 'ev.post', text: 'iguana', mentions: [Array] },
//    signature: 'iDWUHP/v31LELJ9PRkuPA/12IDwltHRUNRYQ0YkRUrr9wPCgi/VUzNrUmid7N64TYjeV6dL9dUx5ESShTsiqCg==.sig.ed25519'
//  },
//  timestamp: 1586138755568
//}
```

