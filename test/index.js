import test from 'tape'
import ssc from '../index.js'

test('did to public key', t => {
    const did = 'did:key:z82T5YYAksSNmvvaiJdvCMVPhkqQUxJEXTjDPR3DpXD9vFb21saw7wJebD87p1hT2sGzygEbpBKiDEPnJ5acuQ7zbDLJZ'
    const pubKey = ssc.didToPublicKey(did)
    // console.log('pub key', pubKey)
    t.equal(pubKey.type, 'ed25519', 'type should be ed25519')
    t.ok(pubKey.publicKey, 'should have .publicKey')
    t.equal(pubKey.publicKey, 'BKer4unf2N9zNsOYD/6eYAOVLY2R+tShLe3Cja3XYjrN2V0MIts6fP0rgXTpIXJvNqieTUb5OmgYNtR+/wP2MUY=',
        'should return the right public key')
    t.end()
})
