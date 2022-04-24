import test from 'tape'
import ssc from '../index.js'
import { webcrypto } from "one-webcrypto"

test('create keys', t => {
    ssc.createKeys().then(alice => {
        t.ok(alice.did, 'should return a DID')
        t.ok(alice.id, 'should return an ID')
        t.equal(alice.id[0], '@', 'should have the right format ID')
        t.ok(alice.id.includes('.ed25519'), 'should have the right format ID')
        t.ok(alice.keys.publicKey, 'should have public key')
        t.ok(alice.keys.privateKey, 'should have private key')
        t.ok(alice.keys.publicKey instanceof webcrypto.CryptoKey,
            'public key should be a CryptoKey')
        t.ok(alice.keys.privateKey instanceof webcrypto.CryptoKey,
            'private key should be a CryptoKey')
        t.end()
    })
})

test('did to public key', t => {
    const did = 'did:key:z82T5YYAksSNmvvaiJdvCMVPhkqQUxJEXTjDPR3DpXD9vFb21saw7wJebD87p1hT2sGzygEbpBKiDEPnJ5acuQ7zbDLJZ'
    const pubKey = ssc.didToPublicKey(did)
    t.equal(pubKey.type, 'ed25519', 'type should be ed25519')
    t.ok(pubKey.publicKey, 'should have .publicKey')
    t.equal(pubKey.publicKey, 'BKer4unf2N9zNsOYD/6eYAOVLY2R+tShLe3Cja3XYjrN2V0MIts6fP0rgXTpIXJvNqieTUb5OmgYNtR+/wP2MUY=',
        'should return the right public key')
    t.end()
})

test('public key to id', t => {
    ssc.createKeys().then(alice => {
        ssc.publicKeyToId(alice.keys.publicKey).then(id => {
            t.equal(id[0], '@', 'should start with @ symbol')
            t.ok(id.includes('.ed25519'),
                'should include the algorithm in the id')

            ssc.exportKeys(alice.keys).then(ks => {
                t.ok(id.includes(ks.public),
                    'the id should contain the public key')
                t.end()
            })
        })
    })
})

test('public key to did', t => {
    const pubKey = 'BKer4unf2N9zNsOYD/6eYAOVLY2R+tShLe3Cja3XYjrN2V0MIts6fP0rgXTpIXJvNqieTUb5OmgYNtR+/wP2MUY='
    const did = 'did:key:z82T5YYAksSNmvvaiJdvCMVPhkqQUxJEXTjDPR3DpXD9vFb21saw7wJebD87p1hT2sGzygEbpBKiDEPnJ5acuQ7zbDLJZ'
    t.equal(ssc.publicKeyToDid(pubKey), did, 'should return the expected DID')
    t.end()
})
