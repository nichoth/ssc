# ssc

Static functions for working with a merkle-dag.

This is `ssb` but more boring. `ssc` because c comes after b in the alphabet


-------------------------------------------------------


## CLI

### install

```
npm i -g @nichoth/ssc
```

### keys
Create a new keypair, written to stdout

```
% ssc keys
```

```
{
  "public": "BCgXk5VVmWd6odnczvUTMuhqxRJSHkA9roas7mtV3BF/Uj2u3/Pr0lINgToXvGjO/b0oZKNh1d1d2Q9CHU3UGB8=",
  "private": "MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgem10DNzZ3BBXKmfFIELfisCzByOFh6joTn4+O+jE8TqhRANCAAQoF5OVVZlneqHZ3M71EzLoasUSUh5APa6GrO5rVdwRf1I9rt/z69JSDYE6F7xozv29KGSjYdXdXdkPQh1N1Bgf",
  "did": "did:key:z82T5VzE8st7yLSEWweKnFHdZieEvE5rD2AevQ7RgtfwjFHjkguyB69KcHKHRx784Ybqnbmg91qCiMML5Sc3Xh34YbhNW",
  "id": "@BCgXk5VVmWd6odnczvUTMuhqxRJSHkA9roas7mtV3BF/Uj2u3/Pr0lINgToXvGjO/b0oZKNh1d1d2Q9CHU3UGB8=.ed25519"
}
```

### post
Input includes JSON keys piped into stdin. It also requires a `--text` option

This creates a new "post" type message with some new keys that we create, with **`null` as the preceding message**:

```bash
% ssc keys | ssc post --text "woooo more test"
```

```
{
  "previous": null,
  "sequence": 1,
  "author": "@BEJZ0YhJYDKDdkWEzBZF+Rf2HYZeBdtwaXmmshQsjGhEkOEbT0PR6eQiWA5tgBv46iYOlmZp2Z+bhox5UzmlgeU=.ed25519",
  "timestamp": 1650750178099,
  "hash": "sha256",
  "content": {
    "type": "post",
    "text": "wooo more test"
  },
  "signature": "CFaOTRL6QHpmfE6QmN1qhzN9Nh5kxJweHZIbkEVh29Rj4CVlf+EdzBAc2TJyB6b7prUgMd2CC79MbRUjncjYeA=="
}
```

To **set a previous message in this message**, pass in the previous message as the `--prev` option, as a JSON string. This can be used to create a merkle list.

```bash
ssc keys | ssc post --text "woooo testing again" --prev="$(cat ./test/cli/message-json.json)"
```

```
{
  "previous": "%BUfo/WZh51h7eh91PBkdxQLnGfjrkG3ErsDdFmacWIg=.sha256",
  "sequence": 2,
  "author": "@BH7K096VMXU1M1aagMP8Sf7s67MaLZlYmgJ+UmxXutBAmQjnf0+/osPshE0EGHjvSiZ74BLj33u4eRDQFsdnz7U=.ed25519",
  "timestamp": 1650750310248,
  "hash": "sha256",
  "content": {
    "type": "post",
    "text": "wooo testing again"
  },
  "signature": "/mNXHtq6XhK4WxuHPyM5B4lal6nx8iCnphPebGiMaTgBoEJ5GH+p1HxBfa3JaPPon3UlPVnbfcY5EzSU9HaDyw=="
}
```

We pass in the full message because the program takes the hash of the message's JSON for the `previous` field, and also looks at the `sequence` field in the passed in message to determine the `sequence` for this message.


### id
This takes a message value piped into stdin as input, and returns a sha256 hash, written to stdout.

```bash
cat test/cli/message-json.json | ssc id
```

```
%BUfo/WZh51h7eh91PBkdxQLnGfjrkG3ErsDdFmacWIg=.sha256
```



--------------------------------------------------------



## node

### install
```
npm i -S @nichoth/ssc
```


### examples
These demonstrate usage in node js.

#### sign a string
```js
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const test = require('tape')
import ssc from '../index.js'

var keys
var sig
test('sign a string', function (t) {
    ssc.createKeys().then(alice => {
        keys = alice.keys
        ssc.sign(keys, 'a test message')
            .then(_sig => {
                sig = _sig
                t.ok(sig, 'should return a signature')
                t.equal(typeof sig, 'string', 'should return a string')
                t.end()
            })
    })
})

test('validate a signature', t => {
    ssc.verify(keys, sig, 'a test message')
        .then(isValid => {
            t.equal(isValid, true, 'should say a valid signature is valid')
            t.end()
        })
})
```


#### create a message
```js
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const test = require('tape')
import ssc from '../index.js'

var keys
var msg
var msgTwo

test('create a message', function (t) {
    var content = { type: 'test', text: 'woooo' }

    ssc.createKeys()
        .then(_keys => {
            keys = _keys
            ssc.createMsg(keys.keys, null, content)
                .then(_msg => {
                    msg = _msg
                    t.equal(msg.author[0], '@',
                        'should have the correct aughor ID prefix')
                    t.equal(msg.author.split('.')[1], 'ed25519', 
                        'should have the correct author ID suffix')
                    t.equal(msg.content.text, 'woooo',
                        'should have the message text')
                    t.equal(msg.previous, null,
                        'should have `null` as previous message')
                    t.end()
                })
        })
})

test('create a second message', t => {
    var content = { type: 'test', text: 'message two' }
    ssc.createMsg(keys.keys, msg, content)
        .then(_msgTwo => {
            msgTwo = _msgTwo
            t.equal(msgTwo.sequence, 2, 'should have the right sequence number')
            t.equal(msgTwo.previous, ssc.getId(msg),
                'should have the correct previous message ID')
            t.end()
        })
})

test('verify a message', t => {
    t.ok(ssc.isValidMsg(msg, null, keys.keys), 'should validate the first msg')
    t.ok(ssc.isValidMsg(msgTwo, msg, keys.keys),
        'should validate the second msg')
    t.end()
})

test('verify an invalid message', t => {
    var badPrevMsg = ssc.createMsg(keys.keys, null,
        { type: 'test', text: 'ok' })
    t.equal(ssc.isValidMsg(msgTwo, badPrevMsg, keys.keys), false,
        'should return that an invalid message is not valid')
    t.end()
})
```


#### create a merkle list
```js
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const test = require('tape')
import ssc from '../index.js'

var alice
test('init', t => {
    ssc.createKeys()
        .then(_alice => {
            alice = _alice
            t.pass('create keys')
            t.end()
        })
})

test('create a merkle list', async function (t) {
    t.plan(3)
    var arr = ['one', 'two', 'three']
    // this is bad because the async reduce is confusing
    var list = await arr.reduce(async function (acc, val) {
        return acc.then(async _acc => {
            var prev = (_acc[_acc.length - 1] || null)
            var msg = await ssc.createMsg(alice.keys, prev, {
                type: 'test',
                text: val
            })
            _acc.push(msg)
            return _acc
        })
    }, Promise.resolve([]))

    t.equal(list.length, 3, 'should create a merkle list')
    t.equal(list[2].content.text, 'three', 'should have the right msg content')

    var isValidList = list.reduce(function (isValid, msg, i) {
        var prev = list[i - 1] || null
        return isValid && ssc.isValidMsg(msg, prev, alice.keys)
    }, true)

    t.equal(isValidList, true, 'reduced validation should be ok')
})
```


#### create an ssb style message
A message with `key` and `value` properties

```js
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const test = require('tape')
import ssc from '../index.js'

var alice
test('init', t => {
    ssc.createKeys()
        .then(_alice => {
            alice = _alice
            t.pass('create keys')
            t.end()
        })
})

test('create ssb style posts', async function (t) {
    t.plan(4)
    const arr = ['one', 'two', 'three']

    const posts = await arr.reduce(async function (acc, val) {
        return acc.then(async _acc => {
            var prev = (_acc[_acc.length - 1] || null)
            prev = prev === null ? prev : prev.value

            var msg = await ssc.createMsg(alice.keys, prev, {
                type: 'test',
                text: val
            })

            _acc.push({
                key: ssc.getId(msg, null),
                value: msg
            })
            return _acc
        })
    }, Promise.resolve([]))

    t.ok(posts[0].key, 'should have `.key`')
    t.ok(ssc.verifyObj(alice.keys, null, posts[0].value),
        'msg should have valid .value')
    t.equal(posts[0].value.content.text, 'one',
        'should have the right content at the right key')
    t.equal(posts[0].key[0], '%', 'should have the right format id')
})
```


## browser

### install
```
npm i -S @nichoth/ssc
```

### examples
Use in a web browser

#### create keys
```js
import ssc from '@nichoth/ssc'
import test from 'tape'
// we use this just for tests. is not necessary for normal use
import { ECCKeyStore } from 'keystore-idb/lib/ecc/keystore'

test('create keys', t => {
    ssc.createKeys(ssc.keyTypes.ECC).then(ks => {
        t.ok(ks, 'should return a keystore')
        t.ok(ks instanceof ECCKeyStore, 'should be an instance of ECC keystore')

        ssc.createKeys().then(keystore => {
            t.ok(keystore, 'the keyType parameter is optional')
            t.end()
        })
    })
})
```
