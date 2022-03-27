import * as http from 'http';
import ssc from '../../index.js'

var serverKeys
ssc.createKeys().then(keys => {
    serverKeys = keys
    console.log('server public', serverKeys.keys.publicKey)
    console.log('sssssssssssssss', serverKeys)
    startServer()
})

function startServer () {
    console.log('server keys', serverKeys)

    const server = http.createServer(function onRequest (req, res) {
        const path = req.url
        console.log('**path**', path)

        res.setHeader('Access-Control-Allow-Origin', '*');

        if (path.includes('who-are-you')) {
            res.end('meeeee')
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

