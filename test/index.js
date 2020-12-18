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

