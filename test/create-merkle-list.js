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

test('create a merkle list', async function (t) {
    t.plan(3)
    var arr = ['one', 'two', 'three']
    // this is bad because the async reduce is confusing
    var list = await arr.reduce(async function (acc, val) {
        return acc.then(async _acc => {
            var prev = (_acc[_acc.length - 1] || null)
            var msg = await ssc.createMsg(alice.keys, prev, {
                type: 'test',
                text: val
            })
            _acc.push(msg)
            return _acc
        })
    }, Promise.resolve([]))

    console.log('*list*')
    console.log(list)

    t.equal(list.length, 3, 'should create a merkle list')
    t.equal(list[2].content.text, 'three', 'should have the right msg content')

    var isValidList = list.reduce(function (isValid, msg, i) {
        var prev = list[i - 1] || null
        return isValid && ssc.isValidMsg(msg, prev, alice.keys)
    }, true)

    t.equal(isValidList, true, 'reduced validation should be ok')
})
