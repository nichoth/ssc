import test from 'tape'
import * as ucan from 'ucans'
import ssc from '../web'
import { ECCKeyStore } from 'keystore-idb/lib/ecc/keystore'
import { didToPublicKey } from 'ucans'

var ks
test('create keys', async t => {
    ks = await ssc.createKeys(ssc.keyTypes.ECC)
    t.ok(ks, 'should return a keystore')
    t.ok(ks instanceof ECCKeyStore, 'should be an instance of ECC keystore')
    t.end()
})

test('sign and validate something', async t => {
    var sig = await ks.sign('my message')
    t.ok(sig, 'should sign a message')
    const publicKey = await ks.publicWriteKey()
    var isValid = await ks.verify('my message', sig, publicKey)
    t.equal(isValid, true, 'should return a valid signature')
})

var msg
var msgDid
// var msgUserId
test('create a message', async t => {
    var content = { type: 'test', text: 'woooo' }
    msg = await ssc.createMsg(ks, null, content)
    t.ok(msg, 'should create a message')

    const pubKey = await ks.publicWriteKey()
    // const userId = msgUserId = '@' + pubKey + '.ed25519'
    const did = msgDid = ssc.publicKeyToDid(pubKey, 'ed25519')
    t.equal(msg.author, did, 'should have right the message author')
    t.equal(msg.content.type, 'test', 'should have the message content')
    t.ok(msg.signature, 'should have the message signature')
    t.end()
})

test('verify a message', async t => {
    const pubKey = didToPublicKey(msgDid).publicKey
    var msgIsOk = await ssc.verifyObj(pubKey, msg)
    t.equal(msgIsOk, true, 'should return true for a valid message')
    t.end()
})

// TODO -- check with an invalid message

// TODO -- should validate with just a public key or DID
test('is valid message', async t => {
    const pubKey = ssc.didToPublicKey(msgDid).publicKey
    // console.log('**pub key**', pubKey)
    var isValid = await ssc.isValidMsg(msg, null, pubKey)
    t.plan(1)
    t.equal(isValid, true, 'should return true for valid message')
})

var msg2
test('create a second message', async t => {
    t.plan(1)
    var content2 = { type: 'test2', text: 'ok' }
    // we pass in the original msg here
    msg2 = await ssc.createMsg(ks, msg, content2)
    t.ok(msg2.previous === ssc.getId(msg), 
        'should create `prev` as the previous msg hash')
    // => true 
})

// checks that the message contains the hash of prevMsg, and also makes sure
// the signature is valid.
test('validate the second message', async t => {
    // (msg, prevMsg, keys)
    var isValid = await ssc.isValidMsg(msg2, msg, ks)
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

    // const publicKey = await ks.publicWriteKey()
    // var did = ssc.publicKeyToDid(publicKey, 'rsa')
    // t.equal(list[0].author, '@' + publicKey + '.ed25519',
    //     'should have the right author')
    t.equal(list[0].author, msgDid, 'should have the right author')

    var isValidList = await list.reduce(async function (isValid, msg, i) {
        var prev = list[i - 1] || null
        return isValid && await ssc.isValidMsg(msg, prev, ks)
    }, true)

    t.equal(isValidList, true, 'reduced validation should be ok')
})

test('public key to DID', t => {
    const pubKey = 'BADJg6SOcJ+jEXAWQ1iHVDbH7dF6lGgYYRlx2uJRvFhLtvQtOpdqaNq5uonyG2MFkfuj6iHWsHLS3oD2RhcWOFU='
    const expectedDid = 'did:key:z82T5VCebjLZoZshfGbYZuEEFg79vmMxVibQ9eHcSN63E3p5MxDy9UwJDrZbgXacW4HbCEfYqrTa2sprh694EXc6L5cWg'
    // these are RSA version
    // const pubkey = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAnzyis1ZjfNB0bBgKFMSvvkTtwlvBsaJq7S5wA+kzeVOVpVWwkWdVha4s38XM/pa/yr47av7+z3VTmvDRyAHcaT92whREFpLv9cj5lTeJSibyr/Mrm/YtjCZVWgaOYIhwrXwKLqPr/11inWsAkfIytvHWTxZYEcXLgAXFuUuaS3uF9gEiNQwzGTU1v0FqkqTBr4B8nW3HCN47XUu0t8Y0e+lf4s4OxQawWD79J9/5d3Ry0vbV3Am1FtGJiJvOwRsIfVChDpYStTcHTCMqtvWbV6L11BWkpzGXSW4Hv43qa+GSYOD2QU68Mb59oSk2OB+BtOLpJofmbGEGgvmwyCI9MwIDAQAB"
    // const expectedDid = "did:key:z13V3Sog2YaUKhdGCmgx9UZuW1o1ShFJYc6DvGYe7NTt689NoL2RtpVs65Zw899YrTN9WuxdEEDm54YxWuQHQvcKfkZwa8HTgokHxGDPEmNLhvh69zUMEP4zjuARQ3T8bMUumkSLGpxNe1bfQX624ef45GhWb3S9HM3gvAJ7Qftm8iqnDQVcxwKHjmkV4hveKMTix4bTRhieVHi1oqU4QCVy4QPWpAAympuCP9dAoJFxSP6TNBLY9vPKLazsg7XcFov6UuLWsEaxJ5SomCpDx181mEgW2qTug5oQbrJwExbD9CMgXHLVDE2QgLoQMmgsrPevX57dH715NXC2uY6vo2mYCzRY4KuDRUsrkuYCkewL8q2oK1BEDVvi3Sg8pbC9QYQ5mMiHf8uxiHxTAmPedv8"
    var did = ssc.publicKeyToDid(pubKey)
    t.equal(did, expectedDid, 'should return the right DID')
    t.end()
})

// test('get the DID from public key', async t => {
//     const publicKey = await ks.publicWriteKey()
//     var did = ssc.publicKeyToDid(publicKey)
//     t.equal(did, msgDid, 'should return a DID from a key')
//     t.end()
// })

test('get author from a message', t => {
    var author = ssc.getAuthor(msg)
    t.equal(author, msgDid, 'should get the DID from a message')
    t.end()
})

test('get DID from some keys', async t => {
    var auth = await ssc.getDidFromKeys(ks)
    t.equal(auth, ssc.getAuthor(msg),
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
                // audience should be a DID
                // (audience is a publicKey)
                audience: did,
                // issuer: did,
                // Note that the issuer always has to be your DID,
                // because the UCAN will be signed with your private key.
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

test('is the ucan valid', t => {
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

// should get the root ucan, then check the permissions of the root
