// import { createRequire } from 'module';
// const require = createRequire(import.meta.url);

import * as http from 'http'
import ssc from '../../index.js'
import * as ucan from 'ucans'

var serverDid

ucan.EdKeypair.create().then(keypair => {
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

                ssc.isValidMsg(msg, null, publicKeyObj.publicKey)
                    .then((validMsg) => {
                        return validMsg ? res.end('ok') : res.end('booo')
                    })
            })
        }

        return res.end('ciao')
    })

    server.listen(8888)
    console.log('listening on :8888')
}
