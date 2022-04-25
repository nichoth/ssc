import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import * as http from 'http';
import ssc from '../../index.js'
import * as ucan from 'ucans'

const stringify = require('json-stable-stringify')
// import { webcrypto } from 'one-webcrypto'
// import * as did from "ucans/dist/did/index.js"
// import { EdKeypair } from 'ucans';
// import { Chained } from "ucans/dist/chained.js"
// import * as token from "ucans/dist/token.js"
// import { parse } from "ucans/dist/token.js"
// console.log('token', token)
// const { parse } = require('ucans/dist/token')
// import { parse } from 'path';


var serverKeys
var serverDid
var serverEdKeys

ucan.EdKeypair.create().then(keypair => {
    serverKeys = keypair
    serverEdKeys = keypair
    // console.log('did', keypair.did())
    serverDid = keypair.did()
    startServer()
})

function startServer () {
    const server = http.createServer(function onRequest (req, res) {
        const path = req.url
        res.setHeader('Access-Control-Allow-Origin', '*');

        if (path.includes('who-are-you')) {
            return res.end(serverDid)
        }

        if (path.includes('verify')) {
            let incomingBody = ''
            req.on('data', chunk => (incomingBody += chunk.toString()))

            return req.on('end', () => {
                const msg = JSON.parse(incomingBody)
                const publicKeyObj = ssc.didToPublicKey(ssc.getAuthor(msg))
                const sig = msg.signature

                ssc.isValidMsg(msg, null, publicKeyObj.publicKey)
                    .then((validMsg) => {
                        console.log('is valid msg in server???', validMsg)

                        return validMsg ? res.end('ok') : res.end('booo')
                    })
            })
        }

        return res.end('ciao')
    })

    server.listen(8888)
    console.log('listening on :8888')
}
