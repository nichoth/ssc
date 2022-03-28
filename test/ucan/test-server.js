import * as http from 'http';
import ssc from '../../index.js'
import * as ucan from 'ucans'
// import { webcrypto } from 'one-webcrypto'
// import * as did from "ucans/dist/did/index.js"
// import { EdKeypair } from 'ucans';
// import { Chained } from "ucans/dist/chained"
import * as token from "ucans/dist/token.js"
import { parse } from 'path';

var serverKeys
var serverDid
var serverEdKeys

// function createKeys () {
//     const uses = ['sign', 'verify']

//     return webcrypto.subtle.generateKey({
//         name:  ECC_WRITE_ALG,
//         namedCurve: 'P-256'
//     }, true, uses)
//         .then(keys => {
//             return publicKeyToId(keys.publicKey)
//                 .then(id => {
//                     return { id, keys }
//                 })
//         })
// }

ucan.EdKeypair.create().then(keypair => {
    serverKeys = keypair
    serverEdKeys = keypair
    console.log('did', keypair.did())
    serverDid = keypair.did()
    startServer()
})

// vvvvvv ----------this doesnt work --------------- vvvvv
// ssc.createKeys().then(keys => {
// createKeys().then(keys => {
//     serverKeys = keys
//     console.log('keys', keys)

//     const edKeys = new EdKeypair(keys.keys.secretKey, keys.keys.publicKey, true)
//     serverEdKeys = edKeys
//     const pubKey = ssc.idToPublicKey(serverKeys.id)
//     const did = ssc.publicKeyToDid(pubKey)
//     serverDid = did

//     startServer()
// })

function startServer () {
    const server = http.createServer(function onRequest (req, res) {
        const path = req.url
        res.setHeader('Access-Control-Allow-Origin', '*');

        if (path.includes('who-are-you')) {
            return res.end(serverDid)
        }

        if (path.includes('get-ucan')) {
            let aliceDid = ''

            req.on('data', chunk => aliceDid += chunk.toString())

            return req.on('end', () => {
                ucan.build({
                    audience: aliceDid, //recipient DID
                    issuer: serverEdKeys, //signing key
                    capabilities: [ // permissions for ucan
                        { hermes: 'alice', cap: 'write' }

                        // {
                        //     "wnfs": "boris.fission.name/public/photos/",
                        //     "cap": "OVERWRITE"
                        // },
                        // {
                        //     "wnfs": "boris.fission.name/private/4tZA6S61BSXygmJGGW885odfQwpnR2UgmCaS5CfCuWtEKQdtkRnvKVdZ4q6wBXYTjhewomJWPL2ui3hJqaSodFnKyWiPZWLwzp1h7wLtaVBQqSW4ZFgyYaJScVkBs32BThn6BZBJTmayeoA9hm8XrhTX4CGX5CVCwqvEUvHTSzAwdaR",
                        //     "cap": "APPEND"
                        // },
                        // {
                        //     "email": "boris@fission.codes",
                        //     "cap": "SEND"
                        // }
                    ]
                }).then(aliceUcan => {
                    res.end(ucan.encode(aliceUcan))
                })
            })
        }

        if (path.includes('post-msg')) {
            let body = ''
            req.on('data', chunk => body += chunk.toString())

            return req.on('end', () => {
                const { msg, sig, ucan, author } = JSON.parse(body)
                const { publicKey } = ssc.didToPublicKey(author)

                Promise.all([
                    ssc.verify(publicKey, sig, msg),

                    token.validate(ucan).then(parsed => {
                        return (parsed && parsed.payload.iss === serverDid)
                    })
                ]).then(([validMsg, validUcan]) => {
                    // console.log('valids', validMsg, validUcan)
                    return (validMsg && validUcan) ?
                        res.end('ok') :
                        res.end('booo')
                })

            })
        }

        return res.end('ciao')
    })

    server.listen(8888)
    console.log('listening on :8888')
}
