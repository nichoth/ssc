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
                    console.log('*msg*', msg)
                    t.end()
                })
        })
})