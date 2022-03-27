import * as http from 'http';


const server = http.createServer(function (req, res) {
    console.log('req.url', req.url)
    const path = req.url
    console.log('**path**', path)

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.write('meeeee')
    res.end()

    // fs.readFile(__dirname + '/data.txt', function (err, data) {
    //     res.end(data);
    // });

    // var stream = fs.createReadStream(__dirname + '/data.txt');
    // stream.pipe(res);
});

server.listen(8888)
console.log('listening on :8888')
