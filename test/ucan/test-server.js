import * as http from 'http';
import ssc from '../../index.js'
// import * as did from "ucans/dist/did/index.js"

var serverKeys
var serverDid
ssc.createKeys().then(keys => {
    serverKeys = keys
    const pubKey = ssc.idToPublicKey(serverKeys.id)
    const did = ssc.publicKeyToDid(pubKey)
    serverDid = did

    startServer()
})

function startServer () {
    const server = http.createServer(function onRequest (req, res) {
        const path = req.url
        // console.log('**path**', path)

        res.setHeader('Access-Control-Allow-Origin', '*');

        if (path.includes('who-are-you')) {
            res.end(serverDid)
        }

        // fs.readFile(__dirname + '/data.txt', function (err, data) {
        //     res.end(data);
        // });

        // var stream = fs.createReadStream(__dirname + '/data.txt');
        // stream.pipe(res);
    });

    server.listen(8888)
    console.log('listening on :8888')
}

