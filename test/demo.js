var test = require('tape')
const got = require('got');
const { spawn } = require('child_process');

var DOMAIN = 'http://localhost:8888'

// ntl.on('message', msg => console.log('*msg*', msg))
// ntl.on('spawn', ev => console.log('*spawned*', ev))

var ntl
test('setup', function (t) {
    ntl = spawn('npx', ['netlify', 'dev']);

    ntl.stdout.once('data', (data) => {
        console.log(`stdout: ${data}`);
        t.end()
    })

    ntl.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    })

    ntl.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
    })
})

test('demo', function (t) {
    t.plan(1)
    got(DOMAIN + '/.netlify/functions/test')
        .then(function (res) {
            console.log('in here', res.body)
            t.pass('ok')
        })
        .catch(err => {
            console.log('err', err)
            t.error(err)
        })
})

test('done', function (t) {
    ntl.kill()
    t.end()
})
