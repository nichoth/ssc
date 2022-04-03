import test from 'tape'
import ssc from '../index.js'

test('did to public key', t => {
    const did = 'did:key:z4oJ8bjVigADTmJacgEa3HsLBLnMDpssdB5tH1pSkHm5D5kWF4yRjcan1tWuaVTcnftZt5KxynDKB38pCVgBa281duzVr'
    const pubKey = ssc.didToPublicKey(did)
    console.log('pub key', pubKey)
    t.end()
})
