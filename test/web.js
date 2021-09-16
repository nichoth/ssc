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
    t.equal(isValid, true, 'should return a valid signature')
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

test('verify a message', async t => {
    var msgIsOk = await ssc.verifyObj(ks, msg)
    t.equal(msgIsOk, true, 'should return true for a valid message')
    t.end()
})

test('is valid message', async t => {
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

// checks that the message contains the hash of prevMsg, and also makes sure
// the signature is valid.
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

    // console.log('***list***', list)

    t.equal(list.length, 3, 'should create the right number of list items')

    var isValidList = await list.reduce(async function (isValid, msg, i) {
        var prev = list[i - 1] || null
        return isValid && await ssc.isValidMsg(msg, prev, ks)
    }, true)

    t.equal(isValidList, true, 'reduced validation should be ok')
})
