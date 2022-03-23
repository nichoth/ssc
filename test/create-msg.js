import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const test = require('tape')
import ssc from '../index.js'

test('create a message', function (t) {
    var content = { type: 'test', text: 'woooo' }

    ssc.createKeys()
        .then(keys => {
            ssc.createMsg(keys, null, content)
                .then(msg => {
                    t.equal(typeof msg.author, 'string',
                        'should set msg.author')
                    t.equal(msg.author[0], '@',
                        'should format the ID correctly')
                    t.equal(msg.author.split('.')[1], 'ed25519', 
                        'should format the ID correctly')
                    t.end()
                })
        })
})
