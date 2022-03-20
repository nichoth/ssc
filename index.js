// var sodium = require("chloride")
// var hmac = sodium.crypto_auth
// var curve = require('./sodium')
// var timestamp = require('monotonic-timestamp')
// var ssbKeys = require('ssb-keys')
// var stringify = require('json-stable-stringify')
// var { clone, isObject, getId, hash, isInvalidShape,
//     isString } = require('./util')





// -------- web crypto part ----------------


const { webcrypto } = require("one-webcrypto")


// console.log('webcrypto', webcrypto)
// console.log('webcrypto', webcrypto.subtle)
console.log('webcrypto', webcrypto.subtle.generateKey)

var ks = webcrypto.subtle.generateKey()



// -------------------------------------------


// module.exports = {
//     sign,
//     verifyObj,
//     verify,
//     createMsg,
//     getId,
//     isPrevMsgOk,
//     isValidMsg,
//     createKeys,
//     generate: ssbKeys.generate,
//     hash
// }

// function createKeys () {
//     return ssbKeys.generate()
// }


// // see https://github.com/ssb-js/ssb-keys/blob/main/index.js#L113 and
// // https://github.com/ssb-js/ssb-validate/blob/main/index.js#L317

// // need to implement `checkInvalidCheap`
// // https://github.com/ssb-js/ssb-validate/blob/main/index.js#L134
// // `checkInvalidCheap` is where we check that the prev/next msgs have the
// // right keys

// // here is where the calls start
// // https://github.com/ssb-js/ssb-validate/blob/main/index.js#L167
// // first `checkInvalidCheap`, then `verifyObj`

// function hasSigil (s) {
//     return /^(@|%|&)/.test(s);
// }

// var u = {
//     toBuffer: function (buf) {
//         if (buf == null) return buf;
//         if (Buffer.isBuffer(buf)) return buf;
//         var i = buf.indexOf('.')
//         var start = hasSigil(buf) ? 1 : 0;
//         return Buffer.from(
//             buf.substring(start, ~i ? i : buf.length),
//             "base64"
//         )
//     }
// }

// // just creates a msg, doesn't check that the `msg.previous` key is valid
// function createMsg (keys, prevMsg, content) {
//     // state here is { id, sequence }
//     // exports.create = function (state, keys, hmac_key, content, timestamp) {


//     if (!isObject(content) && !isEncrypted(content)) {
//         throw new Error('invalid message content, ' +
//             'must be object or encrypted string')
//     }

//     var msg = {
//         previous: prevMsg ? getId(prevMsg) : null,
//         sequence: prevMsg ? prevMsg.sequence + 1 : 1,
//         author: keys.id,
//         timestamp: +timestamp(),
//         hash: 'sha256',
//         content: content
//     }

//     var err = isInvalidShape(msg)
//     if (err) throw err
//     return signObj(keys, null, msg)
// }

// function verifyObj (keys, hmac_key, obj) {
//     if (!obj) (obj = hmac_key), (hmac_key = null);
//     obj = clone(obj);
//     var sig = obj.signature;
//     delete obj.signature;
//     var b = Buffer.from(stringify(obj, null, 2));
//     if (hmac_key) b = hmac(b, u.toBuffer(hmac_key));
//     return verify(keys, sig, b);
// }

// function isValidMsg (msg, prevMsg, keys) {
//     return (verifyObj(keys, null, msg) && isPrevMsgOk(prevMsg, msg))
// }

// function isPrevMsgOk (prevMsg, msg) {
//     if (prevMsg === null) return (msg.previous === null)
//     return (msg.previous === getId(prevMsg))
// }

// // takes a public key, signature, and a hash
// // and returns true if the signature was valid.
// // the msg here does not include the `signature` field
// function verify (keys, sig, msg) {
//     if (typeof sig === 'object') {
//         throw new Error('signature should be base64 string,' +
//             'did you mean verifyObj(public, signed_obj)')
//     }

//     return curve.verify(
//         u.toBuffer(keys.public || keys),
//         u.toBuffer(sig),
//         Buffer.isBuffer(msg) ? msg : Buffer.from(msg)
//     )
// }

// function sign (keys, msg) {
//     if (isString(msg)) msg = Buffer.from(msg);
//     if (!Buffer.isBuffer(msg)) throw new Error("msg should be buffer");

//     return (curve
//         .sign(u.toBuffer(keys.private || keys), msg)
//         .toString("base64") + ".sig." + 'ed25519'
//     )
// }

// function signObj (keys, hmac_key, obj) {
//     if (!obj) {
//         obj = hmac_key
//         hmac_key = null
//     }
//     var _obj = clone(obj)
//     var b = Buffer.from(stringify(_obj, null, 2))
//     if (hmac_key) b = hmac(b, u.toBuffer(hmac_key))
//     _obj.signature = sign(keys, b)
//     return _obj
// }
