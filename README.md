# ssc

Static functions for working with a merkle-dag.

This is `ssb` but more boring. `ssc` because c comes after b in the alphabet

-------------------------------------------------------

* [old-style node API](#examples-using-the-old-nodebrowser-api)
* [webCrypto API](#example-using-the-web-crypto-api)

-----------------------------------------------------

## install
```
npm i @nichoth/ssc
```

-------------------------------------------------------

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

### verify a signature
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

### hash
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


---------------------------------------------------------------------


## Example using the Web Crypto API

```js
import test from 'tape'
import * as ucan from 'ucans'
import ssc from '../web'
// we use this just for tests. is not necessary for normal use
import { ECCKeyStore } from 'keystore-idb/lib/ecc/keystore'

var ks
test('create keys', async t => {
    ks = await ssc.createKeys(ssc.keyTypes.ECC)
    t.ok(ks, 'should return a keystore')
    t.ok(ks instanceof ECCKeyStore, 'should be an instance of ECC keystore')
    t.end()
})

// this is an example just using the keystore, not ssc
test('sign and validate something', async t => {
    var sig = await ks.sign('my message')
    t.ok(sig, 'should sign a message')
    const publicKey = await ks.publicWriteKey()
    var isValid = await ks.verify('my message', sig, publicKey)
    t.equal(isValid, true, 'should return a valid signature')
})

var msg
var msgDid
test('create a message', async t => {
    var content = { type: 'test', text: 'woooo' }
    msg = await ssc.createMsg(ks, null, content)
    t.ok(msg, 'should create a message')

    const pubKey = await ks.publicWriteKey()
    const did = msgDid = ssc.publicKeyToDid(pubKey, 'ed25519')
    t.equal(msg.author, did, 'should have right the message author')
    t.equal(msg.content.type, 'test', 'should have the message content')
    t.ok(msg.signature, 'should have the message signature')
    t.end()
})

test('verify a message', async t => {
    // this validates a single message, does not check the merkle-list integrity
    const pubKey = ssc.didToPublicKey(msgDid).publicKey
    var msgIsOk = await ssc.verifyObj(pubKey, msg)
    t.equal(msgIsOk, true, 'should return true for a valid message')
    t.end()
})

// TODO -- check with an invalid message
test('verify an invalid message', async t => {
    const invalidMsg = Object.assign({}, msg, {
        signature: (msg.signature + 'foo')
    })
    const pubKey = ssc.didToPublicKey(msgDid).publicKey
    var msgIsOk = await ssc.verifyObj(pubKey, invalidMsg)
    t.equal(msgIsOk, false, 'should return false for an invalid message')
})

// this checks the merkle integrity of two messages,
// in addition to the signature
test('the merkle list integrity of two messages', async t => {
    const pubKey = ssc.didToPublicKey(msgDid).publicKey
    var isValid = await ssc.isValidMsg(msg, null, pubKey)
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
        'should create `prev` as the previous msg hash')
})

// check that the message contains the hash of prevMsg, and also make sure
// the signature is valid.
test('validate the second message', async t => {
    const pubKey = ssc.didToPublicKey(msgDid).publicKey
    var isValid = await ssc.isValidMsg(msg2, msg, pubKey)
    t.equal(isValid, true, 'should validate a message with a previous hash')
    t.end()
})

// this works but is kind of confusing because of the use of promises &
// async functions. I should re-do this
test('create a merkle list', async t => {
    t.plan(3)
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
    t.equal(list[0].author, msgDid, 'should have the right author')

    const pubKey = ssc.didToPublicKey(msgDid).publicKey

    var isValidList = await list.reduce(async function (isValid, msg, i) {
        var prev = list[i - 1] || null
        return isValid && await ssc.isValidMsg(msg, prev, pubKey)
    }, true)

    t.equal(isValidList, true, 'should be a valid list')
})

test('public key to DID', t => {
    const pubKey = 'BADJg6SOcJ+jEXAWQ1iHVDbH7dF6lGgYYRlx2uJRvFhLtvQtOpdqaNq5uonyG2MFkfuj6iHWsHLS3oD2RhcWOFU='
    const expectedDid = 'did:key:z82T5VCebjLZoZshfGbYZuEEFg79vmMxVibQ9eHcSN63E3p5MxDy9UwJDrZbgXacW4HbCEfYqrTa2sprh694EXc6L5cWg'
    // these are RSA version
    // const pubkey = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAnzyis1ZjfNB0bBgKFMSvvkTtwlvBsaJq7S5wA+kzeVOVpVWwkWdVha4s38XM/pa/yr47av7+z3VTmvDRyAHcaT92whREFpLv9cj5lTeJSibyr/Mrm/YtjCZVWgaOYIhwrXwKLqPr/11inWsAkfIytvHWTxZYEcXLgAXFuUuaS3uF9gEiNQwzGTU1v0FqkqTBr4B8nW3HCN47XUu0t8Y0e+lf4s4OxQawWD79J9/5d3Ry0vbV3Am1FtGJiJvOwRsIfVChDpYStTcHTCMqtvWbV6L11BWkpzGXSW4Hv43qa+GSYOD2QU68Mb59oSk2OB+BtOLpJofmbGEGgvmwyCI9MwIDAQAB"
    // const expectedDid = "did:key:z13V3Sog2YaUKhdGCmgx9UZuW1o1ShFJYc6DvGYe7NTt689NoL2RtpVs65Zw899YrTN9WuxdEEDm54YxWuQHQvcKfkZwa8HTgokHxGDPEmNLhvh69zUMEP4zjuARQ3T8bMUumkSLGpxNe1bfQX624ef45GhWb3S9HM3gvAJ7Qftm8iqnDQVcxwKHjmkV4hveKMTix4bTRhieVHi1oqU4QCVy4QPWpAAympuCP9dAoJFxSP6TNBLY9vPKLazsg7XcFov6UuLWsEaxJ5SomCpDx181mEgW2qTug5oQbrJwExbD9CMgXHLVDE2QgLoQMmgsrPevX57dH715NXC2uY6vo2mYCzRY4KuDRUsrkuYCkewL8q2oK1BEDVvi3Sg8pbC9QYQ5mMiHf8uxiHxTAmPedv8"
    var did = ssc.publicKeyToDid(pubKey)
    t.equal(did, expectedDid, 'should return the right DID')
    t.end()
})

test('get author from a message', t => {
    var author = ssc.getAuthor(msg)
    t.equal(author, msgDid, 'should get the DID from a message')
    t.end()
})

test('get DID from some keys', async t => {
    var auth = await ssc.getDidFromKeys(ks)
    t.equal(auth, ssc.getAuthor(msg),
        'should get the author DID from a set of keys')
    t.end()
})

var myUcan
test('create a ucan', async t => {
    t.plan(3)

    const keypair = await ucan.EdKeypair.create()

    var _did

    return ssc.getDidFromKeys(ks)
        .then(did => {
            _did = did

            return ucan.build({
                // audience should be a DID
                // (audience is a publicKey)
                audience: did,
                // issuer: did,
                // Note that the issuer always has to be the DID of the signer,
                // because the UCAN will be signed with your private key.
                issuer: keypair,
                // facts: [],
                lifetimeInSeconds: 60 * 60 * 24, // UCAN expires in 24 hours
                capabilities: [
                    {
                        "wnfs": "boris.fission.name/public/photos/",
                        "cap": "OVERWRITE"
                    }
                ],
                // proof: 'foo'
                proof: null
            })
        })
        .then(_ucan => {
            myUcan = _ucan
            t.ok(myUcan, 'make a ucan')
            t.equal(_ucan.payload.att[0].wnfs,
                "boris.fission.name/public/photos/",
                'should set att to capability')
            t.equal(_ucan.payload.aud, _did,
                'should put the audience did in the ucan')
        })
})

test('is the ucan valid?', t => {
    t.plan(1)
    ucan.isValid(myUcan)
        .then(valid => {
            t.equal(valid, true, 'should be a valid ucan')
            t.end()
        })
        .catch (err => {
            t.error(err, 'should not throw')
            t.end()
        })
})

// should get the root ucan, then check the permissions of the root
```
