var test = require('tape')
const got = require('got')
const { spawn } = require('child_process')
var validate = require('ssb-validate')
var ssbKeys = require("ssb-keys")
var timestamp = require('monotonic-timestamp')

var PATH = 'http://localhost:8888/.netlify/functions'

var ntl
var keys

var testMsg = {
    keys: {
        public: 'vYAqxqmL4/WDSoHjg54LUJRN4EH9/I4A/OFrMpXIWkQ=.ed25519'
    },
    // this is the message we created in the prev test
    msg: {
        previous: null,
        sequence: 1,
        author: '@vYAqxqmL4/WDSoHjg54LUJRN4EH9/I4A/OFrMpXIWkQ=.ed25519',
        timestamp: 1606692151952,
        hash: 'sha256',
        content: { type: 'test', text: 'woooo' },
        signature: 'wHdXRQBt8k0rFEa9ym35pNqmeHwA+kTTdOC3N6wAn4yOb6dsfIq/X0JpHCBZVJcw6Luo6uH1udpq12I4eYzBAw==.sig.ed25519'
    }
}

test('setup', function (t) {
    ntl = spawn('npx', ['netlify', 'dev', '--port=8888']);
    keys = ssbKeys.generate()

    // ntl.stdout.on('data', function (d) {
    //     console.log('stdout', d.toString('utf8'))
    // })

    ntl.stdout.once('data', (/* data */) => {
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
    got(PATH + '/test')
        .then(function (res) {
            t.pass('ok')
        })
        .catch(err => {
            t.error(err)
        })
})

test('create a message', function (t) {
    // can't use the .initial() `state` in the call to v.create, it creates
    // the wrong sequence number
    // https://github.com/ssb-js/ssb-validate/blob/main/index.js#L317
    // var state = validate.initial()
    // console.log('*state*', state)
    // so we pass in `state` as null instead
    // exports.create = function (state, keys, hmac_key, content, timestamp)

    // in ssb-db they do it like
    // var msg = V.create(state.feeds[opts.keys.id],
    // so the first arg would be `undefined` in this case, where there is no
    // `state.feeds` data
    // state -- { validated: 0, queued: 0, queue: [], feeds: {}, error: null }
    // https://github.com/ssbc/ssb-db/blob/788cd5c5d067b3bc90949337d8387ba1b0151276/minimal.js#L151
    t.plan(2)

    var content = { type: 'test', text: 'woooo' }
    // exports.create = function (state, keys, hmac_key, content, timestamp) {
    var msg = validate.create(null, keys, null, content, timestamp())
    // console.log('*msg*', msg)
    t.ok(msg, 'should create a message')
    t.equal(msg.content.type, 'test', 'should create the right content')

    // TODO
    // create a second message
})

// validate a msg
// comes down to sodium.verify --
// https://github.com/ssb-js/ssb-keys/blob/main/index.js#L104


// @TODO
// * create and sign msg client side
// * test with the same public key twice, to make sure subsequent messages
//   are valid
// * test with unknown public key
// * test with invalid signature

// just copy paste a valid message into the test, since this is a test of the
// backend -- no need to test *creating* the message
test('publish', function (t) {
    t.plan(2)

    got.post(PATH + '/publish', {
        json: testMsg,
        responseType: 'json'
    })
        .then(function (res) {
            t.pass('got a response')
            t.equal(res.body.message.signature, testMsg.msg.signature,
                'should send back the message')
            // console.log('res', res.body)
        })
        .catch(err => {
            t.error(err)
        })
})

test('publish another message', function (t) {
    t.plan(1)

    got.post(PATH + '/publish', {
        json: testMsg,
        responseType: 'json'
    })
        .then(function (res) {
            t.pass('got a response')
            t.equal(res.body.message.signature, testMsg.msg.signature,
                'should send back the message')
            // console.log('res', res.body)
        })
        .catch(err => {
            t.error(err)
        })
})


test('all done', function (t) {
    ntl.kill()
    t.end()
})

// toKeyValueTimestamp:
// https://github.com/ssb-js/ssb-validate/blob/main/index.js#L204
// `msg` is just the 'value' level

// the msg key is the id is the hash of the message (the value in KVT)
// https://github.com/ssb-js/ssb-validate/blob/main/index.js#L339



