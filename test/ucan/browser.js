// import * as ucan from 'ucans'
import test from 'tape'
import ssc from '../../web/index.js'
// import { Chained } from "ucans/dist/chained"
// import * as token from "ucans/dist/token"
// import { capabilities } from "ucans/dist/attenuation"
// import { ECCKeyStore } from 'keystore-idb/lib/ecc/keystore'

// const fs = require('fs')
// import fs from 'fs'
// // const path = require('path')
// import path from 'path';
// import { fileURLToPath } from 'url';
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// we may want to start a localhost server and run these tests against the
// server, because writing to the filesystem doesn't seem to be working
// that well

// _server-side tests_
// * [ ] _server-side_ -- create a self-signed UCAN on the server
// * [ ] _server-side_ -- create a UCAN for alice's DID, signed by the server's
// keypair, with the server's UCAN as root
// * [ ] _server-side_ -- send alice's UCAN back to the client side

var alice

test('init', t => {
    ssc.createKeys().then(keys => {
        alice = keys
        // t.ok(!!keys, 'should return a keystore')
        // t.ok(alice instanceof ECCKeyStore,
        //     'should be an instance of ECC keystore')
            
        ssc.getDidFromKeys(alice).then(did => {
            // console.log('did', did)
            // fs.writeFileSync(__dirname + '/alice-did.json', did)
            t.end()
        })
    }).catch(err => {
        console.log("oh no", err)
    })
})

test('who is the server', t => {
    fetch('http://localhost:8888/who-are-you', {
        method: 'GET'
    })
        .then(res => {
            return res.text()
        })
        .then(res => {
            console.log(res)
            t.ok(res.includes('did:key:'), 'should return a DID')
            t.end()
        })
        .catch(err => {
            console.log('err', err)
            t.end()
        })
})
