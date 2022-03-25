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

var sig
test('sign something with the imported keys', t => {
    // console.log('imported keys', importedKeys)
    ssc.sign(importedKeys, 'a test message')
        .then(_sig => {
            sig = _sig
            t.ok(sig, 'should return a signature')
            t.equal(typeof sig, 'string', 'should return a string as signature')
            t.end()
        })
})

test('verify the signature created with imported keys', t => {
    ssc.verify({ publicKey: importedKeys.publicKey }, sig, 'a test message')
        .then(isValid => {
            t.equal(isValid, true, 'should say a valid signature is valid')
            t.end()
        })
        .catch(err => {
            console.log('errrrrrrr', err)
        })
})
