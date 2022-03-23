import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const test = require('tape')
import ssc from '../index.js'

var keys
var msg

test('create a message', function (t) {
    var content = { type: 'test', text: 'woooo' }

    ssc.createKeys()
        .then(_keys => {
            keys = _keys
            ssc.createMsg(keys, null, content)
                .then(_msg => {
                    msg = _msg
                    t.equal(typeof msg.author, 'string',
                        'should set msg.author')
                    t.equal(msg.author[0], '@',
                        'should have the correct ID prefix')
                    t.equal(msg.author.split('.')[1], 'ed25519', 
                        'should have the correct ID suffix')
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
    ssc.createMsg(keys, msg, content)
        .then(msgTwo => {
            t.equal(msgTwo.sequence, 2, 'should have the right sequence number')
            t.equal(msgTwo.previous, ssc.getId(msg),
                'should have the correct previous message ID')
            t.end()
        })
})
