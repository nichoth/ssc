var ssc = require('../web')
// var u = require('../util')
import * as ucan from 'ucans'
import { fromString } from 'uint8arrays/from-string'
import Keystore from 'keystore-idb/lib'


console.log('Keystore', Keystore)

console.log('ucan', ucan)

Keystore.init({ type: 'rsa' })
    .then(async ks => {
        console.log('got store', ks)

        // need to re-do this part
        // var kp = await ks.getKeypair()

        console.log('keypair from keystore', kp)

        // var did = await kp.did()

        console.log('did from keystore keypair.did', did)

        ucan.build({
            // audience should be a DID
            // (audience is a publicKey)
            // audience: 'foo',
            audience: "did:key:zabcde...", //recipient DID
            // audience: await ssc.getDidFromKeys(keys),
            // audience: keypair.did(),
            // must be an object with a function `did`
            issuer: kp,
            // facts: [],
            lifetimeInSeconds: 60 * 60 * 24, // UCAN expires in 24 hours
            capabilities: [
                {
                    "wnfs": "boris.fission.name/public/photos/",
                    "cap": "OVERWRITE"
                }
            ],
            // proof: 'foo'
            proof: null
        })
            .then(ucan => {
                console.log('ucan from keypair', ucan)
            })
    })




var wn = window.webnative

var subtle = crypto.subtle

subtle.generateKey({
    name: "RSASSA-PKCS1-v1_5",
    modulusLength: 2048,
    publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
    hash: "SHA-256"
}, false, ["sign", "verify"])
    .then(async key => {
        const pk = await subtle.exportKey("jwk", key.publicKey)
        console.log('keys from suble crypto', key)
        console.log('pk', pk)
    })


wn.keystore.get()
    .then(async ks => {
        console.log('ks from wn.keystore.get', ks)

        const writeKey1 = await ks.publicWriteKey()
        console.log('public key from wn.keystore', writeKey1)

        var sig = await ks.sign('my message')
        // console.log('the signature', sig)

        var isValid = await ks.verify('my message', sig, writeKey1)
        console.log('is valid signature?', isValid)
    })




// could take a keystore key pair and add a method `.did`

// how to use the keystore with this?
// how does the keypair compare to the keystore?
// we want the new keypair interface, but backed by keystore persistence

// how to use the keystore keys with this?
// vs the ucan.keypair version -- it has a method `did`

console.log('key type', ucan.KeyType)

ucan.keypair.create(ucan.KeyType.RSA)
    .then(async keypair => {
        console.log('**keypair from ucan.keypair**', keypair)

        // keypair must have a method `.did`

        var keys = await ssc.createKeys()
        console.log('keys', keys)

        var otherKeypair = await ucan.keypair.create(ucan.KeyType.RSA)
        console.log('other key pair', otherKeypair)

        var sig = await keypair.sign(fromString('my message'))
        console.log('sig', sig)

        ucan.build({
            // audience should be a DID
            // (audience is a publicKey)
            audience: await ssc.getDidFromKeys(keys),
            // audience: keypair.did(),
            // must be an object with a function `did`
            issuer: keypair,
            // facts: [],
            lifetimeInSeconds: 60 * 60 * 24, // UCAN expires in 24 hours
            capabilities: [
                {
                    "wnfs": "boris.fission.name/public/photos/",
                    "cap": "OVERWRITE"
                }
            ],
            // proof: 'foo'
            proof: null
        })
            .then(_ucan => {
                console.log('got ucan', _ucan)
                ucan.isValid(_ucan)
                    .then(val => console.log('aaa valid', val))

                _ucan.payload.att[1] = { foo: 'barrr' }
                ucan.isValid(_ucan)
                    .then(val => console.log('bbb valid', val))
            })

    })
