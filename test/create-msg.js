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
    t.ok(ssc.isValidMsg(msg, null, alice.keys), 'should validate the first msg')
    t.ok(ssc.isValidMsg(msgTwo, msg, alice.keys),
        'should validate the second msg')
    t.end()
})

test('verify an invalid message', t => {
    var badPrevMsg = ssc.createMsg(alice.keys, null,
        { type: 'test', text: 'ok' })
    t.equal(ssc.isValidMsg(msgTwo, badPrevMsg, alice.keys), false,
        'should return that an invalid message is not valid')
    t.end()
})
