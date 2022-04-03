import * as ucan from 'ucans'
import test from 'tape'
import ssc from '../../web/index.js'
// import { Chained } from "ucans/dist/chained"
// import * as token from "ucans/dist/token"
// import { capabilities } from "ucans/dist/attenuation"

// we use this just for tests. is not necessary for normal use
import { ECCKeyStore } from 'keystore-idb/lib/ecc/keystore'

var mockServer
var mockServerUcan
var alice

test('create keys', t => {
    ssc.createKeys(ssc.keyTypes.ECC).then(keys => {
        alice = keys
        t.ok(!!keys, 'should return a keystore')
        t.ok(alice instanceof ECCKeyStore, 'should be an instance of ECC keystore')
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


var aliceUcan
// this is made server-side, because it is signed with the server's keys
// this is a UCAN created for alice, signed by the server
test("create the first UCAN for alice", t => {
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
            .then(_aliceUcan => {
                aliceUcan = _aliceUcan
                console.log('*alices ucan*', aliceUcan)
                t.end()
            })
            .catch(err => {
                console.log('errrrr', err)
                t.end()
            })
    })
})


// function hermesCaps (chained) {
//     const hermesSemantics = {
//         tryParsing (cap) {
//             return cap
//         },
    
//         tryDelegating (parentCap, childCap) {
//             console.log('***parent cap', parentCap)
//             console.log('***child cap', childCap)
//             return childCap
//             // return childCap.hermes === parentCap.hermes ? childCap : null
//         }
//     }

//     return capabilities(chained, hermesSemantics)
// }


test('create a second ucan, for another device', t => {
    alice.getKeypair().then(keypair => {
        ucan.EdKeypair.create().then(deviceTwo => {
            ucan.build({
                audience: deviceTwo.did(),
                // issuer: alice.getKeypair(),
                issuer: keypair,
                capabilities: [{ hermes: 'member' }],
                proofs: [ ucan.encode(aliceUcan) ]
            })
                .then(ucanTwo => {
                    // console.log('***ucan 2***', _ucan)
                    t.ok(ucanTwo, 'should create a second UCAN')
                    t.equal(ucanTwo.payload.prf[0], ucan.encode(aliceUcan),
                        'should have the original UCAN as proof')
                    t.end()
                })
                .catch(err => {
                    console.log('*err*', err)
                    t.fail(err)
                    t.end()
                })
        })
    })
    .catch(err => {
        console.log('errrrrrrrrrr', err)
        t.end()
    })
})
