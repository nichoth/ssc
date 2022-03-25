import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const test = require('tape')
import ssc from '../index.js'
import fs from "fs";
import { webcrypto } from 'one-webcrypto'

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
            ssc.publicKeyToId(alice.keys).then(id => {
                const userDoc = {
                    id: id,
                    keys
                }
                const data = JSON.stringify(userDoc, null, 2)
                t.equal(typeof keys.public, 'string',
                    'should return public key')
                t.equal(typeof keys.private, 'string',
                    'should return private key')

                fs.writeFileSync(__dirname + '/keys.json', data, 'utf8')

                t.end()
            })
        })
})

var aliceDoc
test('key file', t => {
    const json = fs.readFileSync(__dirname + '/keys.json')
    aliceDoc = JSON.parse(json)
    t.ok(aliceDoc.id, 'should have an id')
    t.equal(typeof aliceDoc.keys.public, 'string', 'should have public key')
    t.equal(typeof aliceDoc.keys.private, 'string', 'should have private key')
    t.end()
})

// how do you import keys from a file?
var importedKeys
test('import keys', t => {
    ssc.importKeys(aliceDoc).then(keys => {
        importedKeys = keys
        t.equal(keys.publicKey.type, 'public', 'should import a public key')
        t.equal(keys.privateKey.type, 'private', 'should import a private key')
        t.end()
    })
})

test('sign something with the imported keys', t => {
    t.end()
})
