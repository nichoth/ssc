var test = require('tape')
const got = require('got')
const { spawn } = require('child_process')
var validate = require('ssb-validate')
var ssbKeys = require("ssb-keys")
var timestamp = require('monotonic-timestamp')

var PATH = 'http://localhost:8888/.netlify/functions'

var ntl
test('setup', function (t) {
    ntl = spawn('npx', ['netlify', 'dev', '--port=8888']);

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


    // *need to try creating a signed msg in the browser*
    // i think we want to copy paste the code for it and then we can
    // `require(buffer)` for the browser

    // can do the test with `tape-run`

    var keys = ssbKeys.generate()
    var content = { type: 'test', text: 'woooo' }
    var msg = validate.create(null, keys, null, content, timestamp())
    // console.log('*msg*', msg)
    t.ok(msg, 'should create a message')
    t.equal(msg.content.type, 'test', 'should create the right content')

    // todo
    // create a second message
})

test('demo again', function (t) {
    t.plan(1)
    var url = PATH + '/test'
    got.post(url, {
        json: {
            hello: 'world'
        },
        responseType: 'json'
    })
        .then(function (res) {
            t.ok(res.body.ok, 'response is ok')
        })
        .catch(err => {
            t.error(err)
        })
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
    t.plan(1)

    got.post(PATH + '/publish', {
        json: {
            keys: {
                public: 'vYAqxqmL4/WDSoHjg54LUJRN4EH9/I4A/OFrMpXIWkQ=.ed25519'
            },
            msg: {
                previous: null,
                sequence: 1,
                author: '@vYAqxqmL4/WDSoHjg54LUJRN4EH9/I4A/OFrMpXIWkQ=.ed25519',
                timestamp: 1606692151952,
                hash: 'sha256',
                content: { type: 'test', text: 'woooo' },
                signature: 'wHdXRQBt8k0rFEa9ym35pNqmeHwA+kTTdOC3N6wAn4yOb6dsfIq/X0JpHCBZVJcw6Luo6uH1udpq12I4eYzBAw==.sig.ed25519'
            }
        },
        responseType: 'json'
    })
        .then(function (res) {
            t.pass('got a response')
        })
        .catch(err => {
            t.error(err)
        })
})


test('all done', function (t) {
    ntl.kill()
    t.end()
})
