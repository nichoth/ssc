import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const test = require('tape')
import ssc from '../index.js'

var alice
var msg
var msgTwo

test('create a message', function (t) {
    var content = { type: 'test', text: 'woooo' }

    ssc.createKeys()
        .then(_keys => {
            alice = _keys
            ssc.createMsg(alice.keys, null, content)
                .then(_msg => {
                    msg = _msg
                    t.ok(msg.author.includes('did:key'),
                        'should have a DID format for author')
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
    ssc.createMsg(alice.keys, msg, content)
        .then(_msgTwo => {
            msgTwo = _msgTwo
            t.equal(msgTwo.sequence, 2, 'should have the right sequence number')
            t.equal(msgTwo.previous, ssc.getId(msg),
                'should have the correct previous message ID')
            t.end()
        })
})

test('verify a message', t => {
    const pubKey = ssc.didToPublicKey(msg.author).publicKey

    Promise.all([
        ssc.isValidMsg(msg, null, alice.keys.publicKey),
        ssc.isValidMsg(msg, null, pubKey)
    ])
        .then(([isVal, isVal2]) => {
            t.ok(isVal, 'should validate the first message')
            t.ok(isVal2, 'should transform a did to a public key')
            t.end()
        })
})

test('get the key for a message', t => {
    const key = ssc.getId(msg)
    t.equal(key[0], '%', 'should return the expected key format')
    t.ok(key.includes('.sha256'), "should include '.sha256' suffix")
    t.notOk(key.includes('/'), 'should return a URL safe string')
    t.end()
})

test('verify an invalid message', async t => {
    var badPrevMsg = ssc.createMsg(alice.keys, null, {
        type: 'test',
        text: 'ok'
    })

    t.equal(await ssc.isValidMsg(msgTwo, badPrevMsg, alice.keys.publicKey),
        false,
        'should return that an invalid message is not valid')

    t.end()
})
