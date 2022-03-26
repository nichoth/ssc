import * as ucan from 'ucans'
import test from 'tape'
import ssc from '../../web/index.js'
// we use this just for tests. is not necessary for normal use
// import { ECCKeyStore } from 'keystore-idb/lib/ecc/keystore'

var mockServer
var mockServerUcan
var ks

test('create keys', t => {
    ssc.createKeys(ssc.keyTypes.ECC).then(keys => {
        ks = keys
        t.ok(!!keys, 'should return a keystore')
        // t.ok(ks instanceof ECCKeyStore, 'should be an instance of ECC keystore')
        t.end()
    })
})

test('init', t => {
    ucan.EdKeypair.create().then(kp => {
        mockServer = kp

        ucan.build({
            audience: mockServer.did(), // recipient
            issuer: mockServer, // self signed
            capabilities: [ // permissions for ucan
                { hermes: 'hermes', cap: 'WRITE' }
            ]
        })
            .then(serverUcan => {
                mockServerUcan = serverUcan
                t.end()
            })
    })
})

var origUcan
test('create a UCAN with write capabilities', t => {
    /** did:key:z6Mkk89bC3JrVqKie71YEcc5M1SMVxuCgNx6zLZ8SYJsxALi */
    // const alice = ucan.EdKeypair.fromSecretKey("U+bzp2GaFQHso587iSFWPSeCzbSfn/CbNHEz7ilKRZ1UQMmMS7qq4UhTzKn3X9Nj/4xgrwa+UqhMOeo4Ki8JUw==")
    // console.log('alice', alice)

    ssc.getDidFromKeys(ks).then(did => {
        // console.log('did', did)

        ucan.build({
            audience: did,
            issuer: mockServer, // signing key
            capabilities: [ // permissions for ucan
                { hermes: 'hermes', cap: 'WRITE' }
            ],
            proof: ucan.encode(mockServerUcan)
        })
            .then(userUcan => {
                origUcan = userUcan
                // console.log("user ucan", userUcan)
                // t.end()
                ucan.isValid(userUcan).then(val => {
                    var root = ucan.rootIssuer(ucan.encode(userUcan))
                    var isOk = val && (root === mockServer.did())

                    console.log('root', root)

                    t.ok(isOk, 'should be a valid UCAN')

                    // console.log('user ucan', userUcan)

                    // console.log('attenuation', userUcan.attenuation)

                    // t.deepEqual(userUcan.attenuation(), [{ hermes: 'member' }],
                    //     'should have the right capabilities')

                    t.end()

                    // t.ok(userUcan.attenuation().find(cap => {
                    //     return cap.hermes === 'member'
                    // }), 'should find the capability that we care about')
                    // t.end()
                })
            })
        })
})





// // test('create a second ucan, for another device', t => {
// //     ucan.EdKeypair.create().then(deviceTwo => {
// //         ssc.getDidFromKeys(deviceTwo).then(did => {
// //             ucan.build({
// //                 audience: did,
// //                 issuer: ks,
// //                 capabilities: [{ hermes: 'member' }],
// //                 proof: ucan.encode(origUcan)
// //             })
// //                 .then(_ucan => {
// //                     console.log('***ucan 2***', _ucan)
// //                     t.end()
// //                 })
// //         })
// //     })
// // })




// var myUcan
// test('create a ucan', async t => {
//     t.plan(3)

//     const issuerKeypair = await ucan.EdKeypair.create()

//     var _did

//     return ssc.getDidFromKeys(ks)
//         .then(did => {
//             _did = did

//             return ucan.build({
//                 audience: did,
//                 // issuer is a priv/pub keypair because the ucan is signed by
//                 // the issuer
//                 issuer: issuerKeypair,
//                 // facts: [],
//                 lifetimeInSeconds: 60 * 60 * 24, // UCAN expires in 24 hours
//                 capabilities: [
//                     {
//                         "wnfs": "boris.fission.name/public/photos/",
//                         "cap": "OVERWRITE"
//                     }
//                 ],
//                 // proof: 'foo'
//                 proof: null
//             })
//         })
//         .then(_ucan => {
//             myUcan = _ucan
//             t.ok(myUcan, 'make a ucan')
//             t.equal(_ucan.payload.att[0].wnfs,
//                 "boris.fission.name/public/photos/",
//                 'should set att to capability')
//             t.equal(_ucan.payload.aud, _did,
//                 'should put the audience did in the ucan')
//         })
// })

// test('is the ucan valid?', t => {
//     t.plan(1)
//     ucan.isValid(myUcan)
//         .then(valid => {
//             t.equal(valid, true, 'should be a valid ucan')
//             t.end()
//         })
//         .catch (err => {
//             t.error(err, 'should not throw')
//             t.end()
//         })
// })
