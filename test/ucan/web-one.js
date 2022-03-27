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

var alice

test('init', t => {
    ssc.createKeys().then(keys => {
        alice = keys
        // t.ok(!!keys, 'should return a keystore')
        // t.ok(alice instanceof ECCKeyStore,
        //     'should be an instance of ECC keystore')
            
        ssc.getDidFromKeys(alice).then(did => {
            console.log('did', did)
            // fs.writeFileSync(__dirname + '/alice-did.json', did)
            t.end()
        })
    }).catch(err => {
        console.log("oh no", err)
    })
})
