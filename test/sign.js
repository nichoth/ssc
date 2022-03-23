import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const test = require('tape')
import ssc from '../index.js'

var _keys
var sig
test('sign a string', async function (t) {
    _keys = await ssc.createKeys()
    console.log('keys', _keys)
    var signature = sig = await ssc.sign(_keys, 'a test message')
    t.ok(signature, 'should return a signature')
    t.equal(typeof signature, 'string', 'should return a string')
    t.end()
})
