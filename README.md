# ssc
Generic functions for working with a merkle-dag.

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
// keys = { public }
var msgIsOk = ssc.verifyObj(keys, null, msg)
// true
```

### create another message
The new message contains the previous message's hash, and is signed by the
message author

```js
var content2 = { type: 'test2', text: 'ok' }
// we pass in the original msg here
var msg2 = ssc.createMsg(keys, msg, content2)
(msg2.previous === ssc.getId(msg))
// => true 
```

### isValidMsg
This checks that the message contains the hash of `prevMsg`, and also
makes sure the signature matches the public key.

```js
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
test('create a merkle list', function (t) {
    t.plan(2)
    var arr = ['one', 'two', 'three']
    var list = arr.reduce(function (acc, val) {
        var prev = acc[acc.length - 1]
        var msg = ssc.createMsg(keys, prev || null, {
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

-----------------------------------

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

