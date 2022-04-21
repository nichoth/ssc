# ssc

Static functions for working with a merkle-dag.

This is `ssb` but more boring. `ssc` because c comes after b in the alphabet

-------------------------------------------------------

## install
```
npm i @nichoth/ssc
```

----------------------------------------------------

## keys

keys created by `ssb-keys` look like this:

```js
{
  curve: 'ed25519',
  public: 'T/Lu07ZOO6k6oRcgv45mtmMY24v22elakI+UVppMI/k=.ed25519',
  private: 'd3OYSdrpN7KGBP+kgJtJtn4nr3dJPUmanct2xJGhntBP8u7Ttk47qTqhFyC/jma2Yxjbi/bZ6VqQj5RWmkwj+Q==.ed25519',
  id: '@T/Lu07ZOO6k6oRcgv45mtmMY24v22elakI+UVppMI/k=.ed25519'
}
```

## examples
These demonstrate usage in node js.

### sign a string
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


### create a message
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


### create a merkle list
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


### create an ssb style message
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


-------------------------------------------------------

## notes

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

