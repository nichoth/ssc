import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const test = require('tape')
import ssc from '../index.js'

var keys
var sig
test('sign a string', function (t) {
    ssc.createKeys().then(alice => {
        keys = alice.keys
        ssc.sign(keys, 'a test message')
            .then(_sig => {
                sig = _sig
                t.ok(sig, 'should return a signature')
                t.equal(typeof sig, 'string', 'should return a string')
                t.end()
            })
    })
})

test('validate a signature', t => {
    // ssc.verify(keys, sig, 'a test message')
    ssc.verify(keys.publicKey, sig, 'a test message')
        .then(isValid => {
            t.equal(isValid, true, 'should say a valid signature is valid')
            t.end()
        })
})
