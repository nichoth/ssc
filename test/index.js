var test = require('tape')
var ssbKeys = require("ssb-keys")
var ssc = require('../')

var keys
var msg

test('create a message', function (t) {
    // can't use the .initial() `state` in the call to v.create, it creates
    // the wrong sequence number
    // https://github.com/ssb-js/ssb-validate/blob/main/index.js#L317
    // var state = validate.initial()
    // console.log('*state*', state)
    // so we pass in `state` as null instead
    // exports.create = function (state, keys, hmac_key, content, timestamp)

    // in ssb-db they do it like
    // var msg = V.create(state.feeds[opts.keys.id],
    // so the first arg would be `undefined` in this case, where there is no
    // `state.feeds` data
    // state -- { validated: 0, queued: 0, queue: [], feeds: {}, error: null }
    // https://github.com/ssbc/ssb-db/blob/788cd5c5d067b3bc90949337d8387ba1b0151276/minimal.js#L151
    t.plan(3)

    keys = ssbKeys.generate()
    var content = { type: 'test', text: 'woooo' }

    // prevMsg
    // { id, sequence }

    // msg:
    //   {
    //     previous: null,
    //     sequence: 1,
    //     author: '@IGrkmx/GjfzaOLNjTpdmmPWuTj5xeSv/2pCP+yUI8eo=.ed25519',
    //     timestamp: 1608054728047,
    //     hash: 'sha256',
    //     content: { type: 'test', text: 'woooo' },
    //     signature: 'LJUQXvR6SZ9lQSlF1w1RFQi3GFIU4B/Cc1sP6kjxnMZn3YW8X7nj9/hlWiTF3cJbWkc9xHvApJ+9uRtHxicXAQ==.sig.ed25519'
    //   }

    // exports.create = function (state, keys, hmac_key, content, timestamp) {
    // var msg = validate.create(null, keys, null, content, timestamp())
    msg = ssc.createMsg(keys, null, content)

    console.log('msg', msg)

    t.ok(msg, 'should create a message')
    t.equal(msg.content.type, 'test', 'should create the right content')
    t.ok(ssc.verifyObj(keys, null, msg), 'message should be valid')
})

test('create a second message in the same feed', function (t) {
    t.plan(4)
    var content = { type: 'test2', text: 'ok' }
    var msg2 = ssc.createMsg(keys, msg, content)
    t.equal(msg2.previous, ssc.getId(msg),
        'should have the previous msg hash')
    t.equal(msg2.content.type, 'test2', 'should create the content')
    t.equal(msg2.sequence, 2, 'should create the right sequence')
    t.equal(msg2.author, '@' + keys.public, 'should have the right author')
})

test('isPrevMsgOk', function (t) {
    t.plan(1)
    var msg = ssc.createMsg(keys, null, { type: 'test', text: 'ok' })
    var msg2 = ssc.createMsg(keys, msg, { type: 'test', text: 'ok' })
    var isOk = ssc.isPrevMsgOk(msg, msg2)
    t.equal(isOk, true, 'should reference the prev msg hash')
})

test('isValidMsg', function (t) {
    t.plan(3)
    var msg = ssc.createMsg(keys, null, { type: 'test', text: 'ok' })
    var msg2 = ssc.createMsg(keys, msg, { type: 'test', text: 'ok' })
    // function isValidMsg (msg, prevMsg, keys) {
    var isOk = ssc.isValidMsg(msg2, msg, keys)
    t.equal(isOk, true, 'should validate a message')

    t.ok(ssc.isValidMsg(msg, null, keys), 'should validate the first msg')

    var badMsg = ssc.createMsg(keys, null, { type: 'test', text: 'ok' })
    var isOkPrev = ssc.isValidMsg(badMsg, msg2, keys)
    t.notOk(isOkPrev, 'should not validate an invalid message')
})

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

// messages have { key, value }
test('create ssb style posts', function (t) {
    t.plan(2)

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
            key: ssc.hash(JSON.stringify(msg, null, 2), null),
            value: msg
        })
        return acc
    }, [])

    t.ok(list[0].key, 'should have `.key`')
    t.ok(ssc.verifyObj(keys, null, list[0].value),
        'msg should have valid .value')
})

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
//
// The key value is a sha256 hash of your message.
// You can sbot.get() the message using that key.



