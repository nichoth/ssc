import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const test = require('tape')
import ssc from '../index.js'
import fs from "fs";

import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
var alice

test('init', t => {
    ssc.createKeys()
        .then(_alice => {
            alice = _alice
            t.pass('create keys')
            t.end()
        })
})

test('export keys', t => {
    ssc.exportKeys(alice.keys)
        .then((keys) => {
            console.log('*pub*', keys.public)
            console.log('*priv*', keys.private)

            ssc.publicKeyToId(alice.keys).then(id => {
                const userDoc = {
                    id: id,
                    keys: {
                        public: keys.public,
                        private: keys.private
                    }
                }
                const data = JSON.stringify(userDoc, null, 2)

                fs.writeFileSync(__dirname + '/keys.json', data, 'utf8')

                t.end()
            })

        })
})

test('key file', t => {
    // t.ok(fs.existsSync(__dirname + '/key.json'))
    const json = fs.readFileSync(__dirname + '/keys.json')
    const alice = JSON.parse(json)
    t.ok(alice.id, 'should have an id')
    t.equal(typeof alice.keys.public, 'string', 'should have public key')
    t.equal(typeof alice.keys.private, 'string', 'should have private key')
    t.end()
})
