var ssc = require('../web')
var test = require('tape')

var ks
test('create keys', async t => {
    ks = await ssc.createKeys()
    // console.log('ks', ks)
    t.ok(ks, 'should return a keystore')
    t.end()
})

test('sign and validate something', async t => {
    var sig = await ks.sign('my message')
    t.ok(sig, 'should sign a message')
    const publicKey = await ks.publicWriteKey()
    var isValid = await ks.verify('my message', sig, publicKey)
    t.equal(isValid, true, 'shoudl be a valid signature')
})
