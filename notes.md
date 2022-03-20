# webcrypto

[SubtleCrypto.generateKey](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/generateKey)

```js
const result = crypto.subtle.generateKey(algorithm, extractable, keyUsages);
```

[cryptoKeypair](https://developer.mozilla.org/en-US/docs/Web/API/CryptoKeyPair)



------------------------------------------------------------



# UCAN notes

## UCAN
How to do invitations? 

A given user should be able to invite another user

UserA creates a UCAN for userB. That means userA must have a DID for userB.

UserA enters an email address. The system sends an email to the address, the
email links to a page with a secret code used to match the new user to
an invitation. 

## When you redeem an invitation
* It creates a DID for you
* check to see if the invitation code is ok
* iff the invitation is ok, then the server follows userB, and can create a DB
record that userA follows userB
* ~~need to create a UCAN for userB. Use a given UCAN as the `proof` in the new user's UCAN. This means you need to save the userA UCAN somewhere (since they created the invitation).~~

Does that work though? You need a `signature` on any ucan

New UCANs need to be signed by the issuer. That means you need to know the
DID of the audience and also have the keys of the issuer when you create a
UCAN.

**Can have a UCAN for the server**, and the server will create a UCAN for
the invited user iff the invitation code is valid. So then the server is
following the userB. Also should create a DB record where userA follows userB.

> The UCAN must be signed with the private key of the issuer to be valid

Here the issuer is the server.

----------------------------------------------------




Note that the `ucans` module has a `browser` field in `package.json`, which means that it import the right file (`dist/index.js`) when you import it then compile with `esmify`


UCANs are a merkle-list of signed objects for user permissions. This is better
than just a DID because it adds some additional fields related to
permissions.

The `DID` here is a [decentralized identifier](https://www.w3.org/TR/did-core/)

You call the `wn.ucan.build` method:

```js
wn.ucan.build({
    // Audience, the ID of who it's intended for
    // who this UCAN describes
    audience: otherDID,
    // the issuer always has to be your DID, because the UCAN will be
    // signed with your private key
    //  the ID of who sent this
    issuer: ourDID,
    // `facts` can be used for arbitrary data
    // facts: [],
    lifetimeInSeconds: 60 * 60 * 24, // UCAN expires in 24 hours
    // `potency` is used by our application
    potency: 'APPEND_ONLY',
    proof: possibleProof
})
    .then((ucan) => {})
```

`proof` in the arguments above is another UCAN. Your application would check
that the UCAN in `proof` is valid, and that it is allowed to give the
specified permissions to the `audience` user.

You would pass it an 'encoded' UCAN:
`possibleProof = wn.ucan.encode(otherUcan)`

`ucan.build` returns an object like:
```js
{
    "header": {
        "alg": "RS256",
        "typ": "JWT",
        "uav": "1.0.0"
    },
    "payload": {
        "aud": "did:key:EXAMPLE",
        "exp": 1631811852,
        "fct": [],
        "iss": "did:key:z13V3Sog...",
        "nbf": 1631811763,
        "prf": "eyJhbGciOiJSU...",
        "ptc": "APPEND_ONLY",
        "rsc": "*"
    },
    "signature": "NtlF3wOoVLlZo..."
}
```

In our application, we check that the UCAN is valid:
```js
wn.ucan.isValid(ucan)
```

Then you want to check that the proof(s) are valid:
```js
if (ucan.prf) {
    wn.ucan.isValid(wn.ucan.decode(ucan.prf))
}
```

You also need to check the permissions -- the `potency` field, and make sure
that the given `proof` is allowed to issue the given permissions.
This forms a chain of UCANs and `proof` UCANs. The final validation of
permissions would happen out of band from the UCAN chain. Meaning, if
there's no proof field, then we need to lookup the `audience` in the UCAN
and verify that their permissions are ok.


```
keystore.init
=>
ECCkeystore.init
=>
IDB.createStore
=>
var store = localforage.createInstance
=>
fn = keys.makeKeypair = () => crypto.subtle.generateKey(
keys.makeKeypair = 
IDB.createIfDoesNotExist(_, fn, store)

```


-------------------------------------------------------------------

