var test = require('tape')
const got = require('got')
const { spawn } = require('child_process')
var validate = require('ssb-validate')
var ssbKeys = require("ssb-keys")
var timestamp = require('monotonic-timestamp')

var DOMAIN = 'http://localhost:8888'

// ntl.on('message', msg => console.log('*msg*', msg))
// ntl.on('spawn', ev => console.log('*spawned*', ev))

var ntl
test('setup', function (t) {
    ntl = spawn('npx', ['netlify', 'dev']);

    ntl.stdout.once('data', (/* data */) => {
        // console.log(`stdout: ${data}`);
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

test('create a message', function (t) {
    // can't use the .initial() `state` in the call to v.create, it creates
    // the wrong sequence number
    // https://github.com/ssb-js/ssb-validate/blob/main/index.js#L317
    // var state = validate.initial()
    // console.log('*state*', state)
    // so we pass in state as null instead
    // exports.create = function (state, keys, hmac_key, content, timestamp)
    t.plan(2)
    var keys = ssbKeys.generate()
    var content = { type: 'test', text: 'woooo' }
    var msg = validate.create(null, keys, null, content, timestamp())
    console.log('*msg*', msg)
    t.ok(msg, 'should create a message')
    t.equal(msg.content.type, 'test', 'should create the right content')
})

test('done', function (t) {
    ntl.kill()
    t.end()
})
