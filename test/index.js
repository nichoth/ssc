import test from 'tape'
import ssc from '../index.js'

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
                t.equal(ks.public, id.replace('@', '').replace('.ed25519', ''),
                    'the id should contain the public key')
                t.end()
            })
        })
    })
})
