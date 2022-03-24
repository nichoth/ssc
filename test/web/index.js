import test from 'tape'
import * as ucan from 'ucans'
import ssc from '../../web/index.js'
// we use this just for tests. is not necessary for normal use
import { ECCKeyStore } from 'keystore-idb/lib/ecc/keystore'

// const Keys = require('../keys.json')

const testMsgs = getTestMsgs()

test('verify the messages created in node', t => {
    const pubKey = ssc.idToPublicKey(testMsgs[0].author)

    ssc.isValidMsg(testMsgs[0], null, pubKey)
        .then(res => {
            console.log('baaaaaaa', res)
            t.ok(res, 'should say it is a valid message')
            t.end()
        })

    // console.log('baaaaaa', ssc.isValidMsg(testMsgs[0], null, pubKey))

    // var isValidList = await testMsgs.reduce(async function (isValid, msg, i) {
    //     var prev = testMsgs[i - 1] || null
    //     return isValid && await ssc.isValidMsg(msg, prev, pubKey)
    // }, true)

    // t.equal(isValidList, true, 'should be a valid list')
    // t.end()
})

var ks
test('create keys', async t => {
    ks = await ssc.createKeys(ssc.keyTypes.ECC)
    t.ok(ks, 'should return a keystore')
    t.ok(ks instanceof ECCKeyStore, 'should be an instance of ECC keystore')
    t.end()
})

// this is an example just using the keystore, not ssc
test('sign and validate something', async t => {
    var sig = await ks.sign('my message')
    t.ok(sig, 'should sign a message')
    const publicKey = await ks.publicWriteKey()
    var isValid = await ks.verify('my message', sig, publicKey)
    t.equal(isValid, true, 'should return a valid signature')
})

var msg
var msgDid
test('create a message', async t => {
    var content = { type: 'test', text: 'woooo' }
    msg = await ssc.createMsg(ks, null, content)
    t.ok(msg, 'should create a message')

    const pubKey = await ks.publicWriteKey()
    const did = msgDid = ssc.publicKeyToDid(pubKey, 'ed25519')
    t.equal(msg.author, ssc.didToId(did),
        'should have right the message author')
    t.equal(msg.content.type, 'test', 'should have the message content')
    t.ok(msg.signature, 'should have the message signature')
    t.end()
})

test('verify a message', async t => {
    // this validates a single message,
    // does not check the merkle-list integrity
    const pubKey = ssc.didToPublicKey(msgDid).publicKey
    var msgIsOk = await ssc.verifyObj(pubKey, msg)
    t.equal(msgIsOk, true, 'should return true for a valid message')
    t.end()
})

test('verify an invalid message', async t => {
    const invalidMsg = Object.assign({}, msg, {
        signature: (msg.signature + 'foo')
    })
    const pubKey = ssc.didToPublicKey(msgDid).publicKey
    var msgIsOk = await ssc.verifyObj(pubKey, invalidMsg)
    t.equal(msgIsOk, false, 'should return false for an invalid message')
    t.end()
})

var msg2
test('create a second message', async t => {
    t.plan(1)
    var content2 = { type: 'test2', text: 'ok' }
    // we pass in the original msg here
    msg2 = await ssc.createMsg(ks, msg, content2)

    t.equal(msg2.previous, ssc.getId(msg), 
        'should create the correct previous message hash')
    t.end()
})


// check that the message contains the hash of prevMsg, and also make sure
// the signature is valid.
test('validate the second message', async t => {
    const pubKey = ssc.didToPublicKey(msgDid).publicKey
    const isValid = await ssc.isValidMsg(msg2, msg, pubKey)

    t.equal(isValid, true, 'should validate a message with a previous hash')
    t.end()
})

// this works but is kind of confusing because of the use of promises &
// async functions. I should re-do this
test('create a merkle list', async t => {
    t.plan(3)
    var arr = ['one', 'two', 'three']
    var list = await arr.reduce(async function (acc, val) {
        return acc.then(async res => {
            var prev = res[res.length - 1]
            if (!res[res.length - 1]) prev = null
            return ssc.createMsg(ks, prev, { type: 'test', text: val })
                .then(result => {
                    res.push(result)
                    return res
                })
        })
    }, Promise.resolve([]))

    t.equal(list.length, 3, 'should create the right number of list items')
    t.equal(list[0].author, ssc.didToId(msgDid),
        'should have the right author')

    const pubKey = ssc.didToPublicKey(msgDid).publicKey

    var isValidList = await list.reduce(async function (isValid, msg, i) {
        var prev = list[i - 1] || null
        return isValid && await ssc.isValidMsg(msg, prev, pubKey)
    }, true)

    t.equal(isValidList, true, 'should be a valid list')
})

test('public key to DID', t => {
    const pubKey = 'BADJg6SOcJ+jEXAWQ1iHVDbH7dF6lGgYYRlx2uJRvFhLtvQtOpdqaNq5uonyG2MFkfuj6iHWsHLS3oD2RhcWOFU='
    const expectedDid = 'did:key:z82T5VCebjLZoZshfGbYZuEEFg79vmMxVibQ9eHcSN63E3p5MxDy9UwJDrZbgXacW4HbCEfYqrTa2sprh694EXc6L5cWg'
    // these are RSA version
    // const pubkey = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAnzyis1ZjfNB0bBgKFMSvvkTtwlvBsaJq7S5wA+kzeVOVpVWwkWdVha4s38XM/pa/yr47av7+z3VTmvDRyAHcaT92whREFpLv9cj5lTeJSibyr/Mrm/YtjCZVWgaOYIhwrXwKLqPr/11inWsAkfIytvHWTxZYEcXLgAXFuUuaS3uF9gEiNQwzGTU1v0FqkqTBr4B8nW3HCN47XUu0t8Y0e+lf4s4OxQawWD79J9/5d3Ry0vbV3Am1FtGJiJvOwRsIfVChDpYStTcHTCMqtvWbV6L11BWkpzGXSW4Hv43qa+GSYOD2QU68Mb59oSk2OB+BtOLpJofmbGEGgvmwyCI9MwIDAQAB"
    // const expectedDid = "did:key:z13V3Sog2YaUKhdGCmgx9UZuW1o1ShFJYc6DvGYe7NTt689NoL2RtpVs65Zw899YrTN9WuxdEEDm54YxWuQHQvcKfkZwa8HTgokHxGDPEmNLhvh69zUMEP4zjuARQ3T8bMUumkSLGpxNe1bfQX624ef45GhWb3S9HM3gvAJ7Qftm8iqnDQVcxwKHjmkV4hveKMTix4bTRhieVHi1oqU4QCVy4QPWpAAympuCP9dAoJFxSP6TNBLY9vPKLazsg7XcFov6UuLWsEaxJ5SomCpDx181mEgW2qTug5oQbrJwExbD9CMgXHLVDE2QgLoQMmgsrPevX57dH715NXC2uY6vo2mYCzRY4KuDRUsrkuYCkewL8q2oK1BEDVvi3Sg8pbC9QYQ5mMiHf8uxiHxTAmPedv8"
    const did = ssc.publicKeyToDid(pubKey)
    t.equal(did, expectedDid, 'should return the right DID')
    t.end()
})

test('ID to public key', t => {
    const ID = ssc.getAuthor(msg)
    t.equal(ssc.didToPublicKey(msgDid).publicKey, ssc.idToPublicKey(ID),
        'should turn ID into public key')
    t.end()
})

test('DID to ID', t => {
    t.equal(ssc.didToId(msgDid), ssc.getAuthor(msg),
        'should transform DID to ID format')
    t.end()
})

test('get author from a message', t => {
    var author = ssc.getAuthor(msg)
    t.equal(author, ssc.didToId(msgDid),
        'should get the author ID from a message')
    t.end()
})

test('get DID from some keys', async t => {
    const authorDID = await ssc.getDidFromKeys(ks)
    t.equal(authorDID, msgDid,
        'should return the same did that was used in the message')
    const pubKey = ssc.didToPublicKey(authorDID).publicKey
    t.equal('@' + pubKey + '.ed25519', ssc.getAuthor(msg),
        'should get the author DID from a set of keys')
    t.end()
})

var myUcan
test('create a ucan', async t => {
    t.plan(3)

    const keypair = await ucan.EdKeypair.create()

    var _did

    return ssc.getDidFromKeys(ks)
        .then(did => {
            _did = did

            return ucan.build({
                audience: did,
                // issuer is a priv/pub keypair because the ucan is signed by
                // the issuer
                issuer: keypair,
                // facts: [],
                lifetimeInSeconds: 60 * 60 * 24, // UCAN expires in 24 hours
                capabilities: [
                    {
                        "wnfs": "boris.fission.name/public/photos/",
                        "cap": "OVERWRITE"
                    }
                ],
                // proof: 'foo'
                proof: null
            })
        })
        .then(_ucan => {
            myUcan = _ucan
            t.ok(myUcan, 'make a ucan')
            t.equal(_ucan.payload.att[0].wnfs,
                "boris.fission.name/public/photos/",
                'should set att to capability')
            t.equal(_ucan.payload.aud, _did,
                'should put the audience did in the ucan')
        })
})

test('is the ucan valid?', t => {
    t.plan(1)
    ucan.isValid(myUcan)
        .then(valid => {
            t.equal(valid, true, 'should be a valid ucan')
            t.end()
        })
        .catch (err => {
            t.error(err, 'should not throw')
            t.end()
        })
})

// these were created with the current `one-webcrypto` node library
function getTestMsgs () {
    return [
        {
            previous: null,
            sequence: 1,
            author: '@BHnPDtFGnngBZC2EvW9KXaS7zG+JuDKCUWBV0e7sVW2Ht/Zl/NU51zVK1b53agpr3/zkERAs/9dhNKyKROW4ZuA=.ed25519',
            timestamp: 1648084584760,
            hash: 'sha256',
            content: { type: 'test', text: 'one' },
            signature: 'cM3Lv9YEx6KpZYTSicEjZt+WKMzNwFg6+wEWcEuQyGYnU8jQt8+VSxMk2Nt1YUxRYZsW5ACku77A12LTJ4GRVQ=='
        },
        {
            previous: '%iD092cE/Rv1KW17k0a2Ym2AA09Jm04j6LIbR37vFgZU=.sha256',
            sequence: 2,
            author: '@BHnPDtFGnngBZC2EvW9KXaS7zG+JuDKCUWBV0e7sVW2Ht/Zl/NU51zVK1b53agpr3/zkERAs/9dhNKyKROW4ZuA=.ed25519',
            timestamp: 1648084584761,
            hash: 'sha256',
            content: { type: 'test', text: 'two' },
            signature: 'G0tTIdYNQg9+YN5kILEgg2tJPKy9mfzFe8vpKUqPJI9ptmWQaLR3T8SKPbeVxchBoNOWbSrV1HoDe++G50Z5FQ=='
        },
        {
            previous: '%MU7bbWfuwrPhIRErNS3An+YxGgGGFwVXeiDg9jl/3C0=.sha256',
            sequence: 3,
            author: '@BHnPDtFGnngBZC2EvW9KXaS7zG+JuDKCUWBV0e7sVW2Ht/Zl/NU51zVK1b53agpr3/zkERAs/9dhNKyKROW4ZuA=.ed25519',
            timestamp: 1648084584762,
            hash: 'sha256',
            content: { type: 'test', text: 'three' },
            signature: 'W6BlcDDMkjh7JZdQEAJOoxrG9Ecpv+IC+KXwIAQWUXtMHovLZQm7eAYsQjeIhLh5j6uf22QBkz9mulAxyyInaw=='
        }
    ]
}
