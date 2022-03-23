import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const test = require('tape')
import ssc from '../index.js'

var _keys
var sig
test('sign a string', async function (t) {
    _keys = await ssc.createKeys()
    var signature = sig = await ssc.sign(_keys, 'a test message')
    t.ok(signature, 'should return a signature')
    t.equal(typeof signature, 'string', 'should return a string')
    t.end()
})

test('validate a signature', t => {
    ssc.verify(_keys, sig, 'a test message')
        .then(isValid => {
            t.equal(isValid, true, 'should say a valid signature is valid')
            t.end()
        })
})
