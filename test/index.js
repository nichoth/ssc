var test = require('tape')
var ssbKeys = require("ssb-keys")
var ssc = require('../')

var keys

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

    // exports.create = function (state, keys, hmac_key, content, timestamp) {
    // var msg = validate.create(null, keys, null, content, timestamp())
    var msg = ssc.createMsg(keys, content)

    t.ok(msg, 'should create a message')
    t.equal(msg.content.type, 'test', 'should create the right content')
    t.ok(ssc.verifyObj(keys, null, msg), 'message should be valid')

    // @TODO
    // create a second message
})
