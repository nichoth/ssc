import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const test = require('tape')
import ssc from '../index.js'

var alice
test('init', t => {
    ssc.createKeys()
        .then(_alice => {
            alice = _alice
            t.pass('create keys')
            t.end()
        })
})

test('create ssb style posts', async function (t) {
    t.plan(4)
    const arr = ['one', 'two', 'three']

    const posts = await arr.reduce(async function (acc, val) {
        return acc.then(async _acc => {
            var prev = (_acc[_acc.length - 1] ?? null)
            prev = prev === null ? prev : prev.value

            var msg = await ssc.createMsg(alice.keys, prev, {
                type: 'test',
                text: val
            })

            _acc.push({
                key: ssc.getId(msg, null),
                value: msg
            })
            return _acc
        })
    }, Promise.resolve([]))

    t.ok(posts[0].key, 'should have `.key`')
    t.ok(ssc.verifyObj(alice.keys.publicKey, null, posts[0].value),
        'msg should have valid .value')
    t.equal(posts[0].value.content.text, 'one',
        'should have the right content at the right key')
    t.equal(posts[0].key[0], '%', 'should have the right format id')
})
