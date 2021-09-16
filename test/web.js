var ssc = require('../web')
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

test('validate a message', async t => {
    t.end()
})
