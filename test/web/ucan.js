import * as ucan from 'ucans'
import test from 'tape'
import ssc from '../../web/index.js'
import { Chained } from "ucans/dist/chained"
import * as token from "ucans/dist/token"
import { capabilities } from "ucans/dist/attenuation"


// we use this just for tests. is not necessary for normal use
// import { ECCKeyStore } from 'keystore-idb/lib/ecc/keystore'

var mockServer
var mockServerUcan
var alice

test('create keys', t => {
    ssc.createKeys(ssc.keyTypes.ECC).then(keys => {
        alice = keys
        t.ok(!!keys, 'should return a keystore')
        // t.ok(alice instanceof ECCKeyStore, 'should be an instance of ECC keystore')
        t.end()
    }).catch(err => {
        console.log("oh no", err)
    })
})

// this is the mock server 
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


// this is made server-side, because it is signed with the server's keys
test('create the first UCAN for alice', t => {
    ssc.getDidFromKeys(alice).then(did => {
        ucan.build({
            audience: did,
            issuer: mockServer, // signing key
            capabilities: [ // permissions for ucan
                // {
                //     "wnfs": "boris.fission.name/public/photos/",
                //     "cap": "OVERWRITE"
                // },
                { hermes: 'name', cap: 'WRITE' }
            ],
            proofs: [ ucan.encode(mockServerUcan) ]
        })
            .then(aliceUcan => {
                console.log('alices ucan', aliceUcan)
                t.end()
            })
            .catch(err => {
                console.log('errrrr', err)
                t.end()
            })
    })
})


function hermesCaps (chained) {
    const hermesSemantics = {
        tryParsing (cap) {
            return cap
        },
    
        tryDelegating (parentCap, childCap) {
            console.log('***parent cap', parentCap)
            console.log('***child cap', childCap)
            return childCap
            // return childCap.hermes === parentCap.hermes ? childCap : null
        }
    }

    return capabilities(chained, hermesSemantics)
}


var origUcan
test('create a UCAN with write capabilities', t => {
    /** did:key:z6Mkk89bC3JrVqKie71YEcc5M1SMVxuCgNx6zLZ8SYJsxALi */
    // const alice = ucan.EdKeypair.fromSecretKey("U+bzp2GaFQHso587iSFWPSeCzbSfn/CbNHEz7ilKRZ1UQMmMS7qq4UhTzKn3X9Nj/4xgrwa+UqhMOeo4Ki8JUw==")
    // console.log('alice', alice)


    ssc.getDidFromKeys(alice).then(did => {
        console.log('did', did)

        // https://github.com/ucan-wg/ts-ucan
        ucan.build({
            audience: did,
            issuer: mockServer, // signing key
            capabilities: [ // permissions for ucan
                // {
                //     "wnfs": "boris.fission.name/public/photos/",
                //     "cap": "OVERWRITE"
                // },
                { hermes: 'name', cap: 'WRITE' }
            ],
            proofs: [ucan.encode(mockServerUcan)]
        })
            .then(userUcan => {
                origUcan = userUcan

                console.log('*user ucan*', userUcan)

                Promise.all([
                    Chained.fromToken(ucan.encode(userUcan))
                        .then(chained => {
                            t.ok(chained, 'should created chained version')
                            console.log('caps', Array.from(hermesCaps(chained)))
                        }),

                    // token.validate(ucan.encode(userUcan)).then(parsed => {
                    //     console.log('*****parsed ucan', parsed)
                    // })
                ])
                    .then(() => t.end())
                    .catch(err => {
                        console.log('*errrrr*', err)
                        t.fail(err)
                        t.end()
                    })

                // console.log('****usss', ucan.issuer())
                // ucan.isValid(userUcan).then(val => {
            //         var root = ucan.rootIssuer(ucan.encode(userUcan))
            //         var isOk = val && (root === mockServer.did())

            //         console.log('root', root)



            //         t.ok(isOk, 'should be a valid UCAN')

            //         // Array.from(emailCapabilities(await Chained.fromToken(token.encode(ucan))))

            //         // console.log('user ucan', userUcan)

            //         // console.log('attenuation', userUcan.attenuation)

            //         // t.deepEqual(userUcan.attenuation(), [{ hermes: 'member' }],
            //         //     'should have the right capabilities')

            //         t.end()

            //         // t.ok(userUcan.attenuation().find(cap => {
            //         //     return cap.hermes === 'member'
            //         // }), 'should find the capability that we care about')
                    // t.end()
                // })
            })
            .catch(err => {
                console.log('errrrrrrrrrrr', err)
                t.end()
            })
        })
})


// test('create a second ucan, for another device', t => {
//     alice.getKeypair().then(keypair => {
//         ucan.EdKeypair.create().then(deviceTwo => {
//             ucan.build({
//                 audience: deviceTwo.did(),
//                 // issuer: alice.getKeypair(),
//                 issuer: keypair,
//                 capabilities: [{ hermes: 'member' }],
//                 proofs: [ ucan.encode(origUcan) ]
//             })
//                 .then(_ucan => {
//                     console.log('***ucan 2***', _ucan)
//                     t.end()
//                 })
//                 .catch(err => {
//                     console.log('*err*', err)
//                     t.fail(err)
//                     t.end()
//                 })
//         })
//     })
//     .catch(err => {
//         console.log('errrrrrrrrrr', err)
//         t.end()
//     })
// })




// // // var myUcan
// // // test('create a ucan', async t => {
// // //     t.plan(3)

// // //     const issuerKeypair = await ucan.EdKeypair.create()

// // //     var _did

// // //     return ssc.getDidFromKeys(ks)
// // //         .then(did => {
// // //             _did = did

// // //             return ucan.build({
// // //                 audience: did,
// // //                 // issuer is a priv/pub keypair because the ucan is signed by
// // //                 // the issuer
// // //                 issuer: issuerKeypair,
// // //                 // facts: [],
// // //                 lifetimeInSeconds: 60 * 60 * 24, // UCAN expires in 24 hours
// // //                 capabilities: [
// // //                     {
// // //                         "wnfs": "boris.fission.name/public/photos/",
// // //                         "cap": "OVERWRITE"
// // //                     }
// // //                 ],
// // //                 // proof: 'foo'
// // //                 proof: null
// // //             })
// // //         })
// // //         .then(_ucan => {
// // //             myUcan = _ucan
// // //             t.ok(myUcan, 'make a ucan')
// // //             t.equal(_ucan.payload.att[0].wnfs,
// // //                 "boris.fission.name/public/photos/",
// // //                 'should set att to capability')
// // //             t.equal(_ucan.payload.aud, _did,
// // //                 'should put the audience did in the ucan')
// // //         })
// // // })

// // // test('is the ucan valid?', t => {
// // //     t.plan(1)
// // //     ucan.isValid(myUcan)
// // //         .then(valid => {
// // //             t.equal(valid, true, 'should be a valid ucan')
// // //             t.end()
// // //         })
// // //         .catch (err => {
// // //             t.error(err, 'should not throw')
// // //             t.end()
// // //         })
// // // })
