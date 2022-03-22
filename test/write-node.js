import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import fs from 'fs'
import ssc from '../index.js'
// import test from 'brittle'
const test = require('tape')
const keys = require('./keys.json')

import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// var keys = ssc.generate()

test('create a list and write it to file', t => {
    var arr = ['one', 'two', 'three']
    var list = arr.reduce(function (acc, val) {
        var prev = (acc[acc.length - 1] || null)
        var msg = ssc.createMsg(keys, prev, {
            type: 'test',
            text: val
        })
        acc.push(msg)
        return acc
    }, [])

    const json = JSON.stringify(list, null, 2)
    fs.writeFileSync(__dirname + '/test-msgs.json', json)
    t.ok(fs.existsSync(__dirname + '/test-msgs.json'))
    t.end()
})
