// import * as ucan from 'ucans'
import test from 'tape'
import ssc from '../../web/index.js'

// import { Chained } from "ucans/dist/chained"
import * as token from "ucans/dist/token"
import * as ucan from 'ucans'
import { Chained } from 'ucans'
// import { keystore } from 'webnative'

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
var aliceDid
var aliceSurrogate
var aliceSurrogateDid



// try creating everything with the ucans library -- all keys
// that way you know they should be compatible



test('init', t => {
    Promise.all([
        ssc.createKeys().then(keys => {
            alice = keys
            ssc.getDidFromKeys(alice).then(did => {
                aliceDid = did
            })
            t.ok(!!keys, 'should return a keystore')
        }).catch(err => {
            console.log("oh no", err)
        }),

        // ssc.createKeys().then(keys2 => {
        //     aliceSurrogate = keys2
        //     aliceSurrogateDid = keys2.getKeypair().then(kp => {
        //         aliceSurrogateDid = kp.did()
        //     })
        // })

        ssc.createKeys(null, { storeName: 'fooo' }).then(keys2 => {
            aliceSurrogate = keys2
            ssc.getDidFromKeys(keys2).then(did => (aliceSurrogateDid = did))
            // aliceSurrogate.getKeypair().then(kp => {
            //     aliceSurrogateDid = kp.did()
            // })
        })

        // ucan.EdKeypair.create().then(keys => {
        //     aliceSurrogate = keys
        //     aliceSurrogateDid = keys.did()
        // })
    ]).then(() => {
        t.end()
    })
})

var serverDid
test('who is the server', t => {
    fetch('http://localhost:8888/who-are-you', {
        method: 'GET'
    })
        .then(res => res.text())
        .then(res => {
            serverDid = res
            t.ok(res.includes('did:key:'), 'should return a DID')
            t.end()
        })
        .catch(err => {
            console.log('errrrrr', err)
            t.end()
        })
})

var encodedUcan
test('get a UCAN issued by the server', t => {
    ssc.getDidFromKeys(alice).then(did => {
        fetch('http://localhost:8888/get-ucan', {
            method: 'POST',
            body: did
        })
            .then(res => res.text())
            .then(_ucan => {
                t.ok(_ucan, 'should return a ucan')
                encodedUcan = _ucan

                token.validate(_ucan)
                    .then(parsed => {
                        t.equal(parsed.payload.iss, serverDid,
                            'UCAN should be issued by the server')
                        t.equal(parsed.payload.aud, did,
                            'should be issued to alice')
                        t.end()
                    })
                    .catch(err => {
                        t.fail()
                        console.log('errrrrrr', err)
                        t.end()
                    })
            })
            .catch(err => {
                console.log('errrrr', err)
                t.fail()
                t.end()
            })
    })
})

test('send the UCAN back to the server, along with a message', t => {
    ssc.sign(alice, 'a test message').then(sig => {
        fetch('http://localhost:8888/post-msg', {
            method: 'POST',
            body: JSON.stringify({
                ucan: encodedUcan,
                author: aliceDid,
                sig,
                msg: 'a test message'
            })
        })
            .then(res => res.text())
            .then(res => {
                t.equal(res, 'ok', 'the server should validate the request')
                t.end()
            })
    })
})



test('request with an invalid UCAN', t => {
    ssc.sign(alice, 'a test message').then(sig => {
        ucan.EdKeypair.create().then(randomKeypair => {

            ucan.build({
                audience: aliceDid, //recipient DID
                issuer: randomKeypair, //signing key
                capabilities: [ // permissions for ucan
                    { hermes: 'alice', cap: 'write' }
                ]
            }).then(selfSignedUcan => {
                fetch('http://localhost:8888/post-msg', {
                    method: 'POST',
                    body: JSON.stringify({
                        ucan: token.encode(selfSignedUcan),
                        author: aliceDid,
                        sig,
                        msg: 'a test message'
                    })
                })
                .then(res => res.text())
                .then(res => {
                    t.equal(res, 'booo', 'the server should reject the request')
                    t.end()
                })
            }).catch(err => {
                console.log('aaaaaaaaaa', err)
                t.end()
            })
        })
    })
})

test('validate a surrogate UCAN from within the same process', async t => {
    const bob = await ucan.EdKeypair.create()
    const sig = await bob.sign('my message')
    console.log('*sig*', sig)
    const carol = await ucan.EdKeypair.create()

    const bobsUcan = await ucan.build({
        audience: bob.did(), // recipient DID
        issuer: carol, // signing key
        capabilities: [ // permissions for ucan
            { hermes: 'bob', cap: 'write' }
        ]
    })

    const carolsUcan = await ucan.build({
        proofs: [ ucan.encode(mockServerUcan) ]
    })

    console.log('bobs ucan', bobsUcan)
    t.end()

    // alice.getKeypair().then(kp => {
        // console.log('keypair', kp)

        // ucan.build({
        //     audience: bob.did(), // recipient DID
        //     issuer: kp, // signing key
        //     capabilities: [ // permissions for ucan
        //         { hermes: 'bob', cap: 'write' }
        //     ]
        // }).then(newUcan => {
        //     console.log('*new ucan*', newUcan)

        //     const enc = token.encode(newUcan)
        //     console.log('**encode**', token.encode)
        //     console.log('**encoded ucan**', enc)

        //     // const parsedUcan = await token.validate(enc)
        //     // const parsedUcan = await token.validate(token.encode(newUcan))
        //     // console.log('**parsed**', parsedUcan)

        //     token.validate(token.encode(newUcan)).then(parsedUcan => {
        //         console.log('**parsed**', parsedUcan)
        //         t.end()
        //     })
        //         .catch(err => {
        //             console.log('**arg**', err)
        //             t.end()
        //         })



            // const chain = await Chained.fromToken(enc)
            // console.log('aaaaaaaaaa')
            // console.log('****chain****', chain)
        // })
    // })
})

// test('post a message with a surrogate UCAN', async t => {
//     // console.log('**alice**', alice)

//     const bob = await ucan.EdKeypair.create()

//     // const sig = await bob.sign('a test message')
//     const sig = await bob.sign('my message')
//     console.log('*sig*', sig)

//     alice.getKeypair().then(kp => {
//         // console.log('keypair', kp)

//         ucan.build({
//             audience: bob.did(), // recipient DID
//             issuer: kp, // signing key
//             capabilities: [ // permissions for ucan
//                 { hermes: 'bob', cap: 'write' }
//             ]
//         }).then(async newUcan => {
//             console.log('*new ucan*', newUcan)

//             const enc = token.encode(newUcan)
//             console.log('**encoded ucan**', enc)
//             const parsedUcan = await token.validate(enc)
//             console.log('**parsed**', parsedUcan)

//             t.end()

//             // const chain = await Chained.fromToken(enc)
//             // console.log('aaaaaaaaaa')
//             // console.log('****chain****', chain)
//         })
//     })
// })
