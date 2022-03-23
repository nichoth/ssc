import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const test = require('tape')
import ssc from '../index.js'

var keys
test('init', t => {
    ssc.createKeys()
        .then(_keys => {
            keys = _keys
            t.pass('create keys')
            t.end()
        })

})

test('create a merkle list', async function (t) {
    t.plan(2)
    var arr = ['one', 'two', 'three']
    var list = arr.reduce(async function (acc, val) {
        console.log('keys', keys)
        var prev = (acc[acc.length - 1] || null)
        var msg = await ssc.createMsg(keys, prev, {
            type: 'test',
            text: val
        })
        console.log('*msg*', msg)
        acc.push(msg)
        return acc
    }, [])

    t.equal(list.length, 3, 'should create a merkle list')

    var isValidList = list.reduce(function (isValid, msg, i) {
        var prev = list[i - 1] || null
        // ssc.isValidMsg(msg2, msg, keys)
        return isValid && ssc.isValidMsg(msg, prev, keys)
    }, true)

    t.equal(isValidList, true, 'reduced validation should be ok')
})
