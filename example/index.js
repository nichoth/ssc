var ssc = require('../web')
var u = require('../util')
import * as ucan from 'ucans'

console.log('ok')

ssc.createKeys().then(async ks => {
    console.log('got keys', ks)
    var keyDID = await didFromKeys(ks)
    console.log('key did', keyDID)
})

function didFromKeys (keys) {
    return ssc.getDidFromKeys(keys)
}

ucan.keypair.create(ucan.KeyType.Edwards)
    .then(keypair => {
        console.log('keypair', keypair)
        ucan.build({
            // audience should be a DID
            // (audience is a publicKey)
            audience: keypair.did(),
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
            .then(ucan => {
                console.log('got ucan', ucan)
            })

    })


// const keypair = await ucan.keypair.create(ucan.KeyType.Edwards)
