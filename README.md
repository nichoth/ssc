# ssc
Using the public key as the user ID returns an error. The ID must be numeric

```
client.query(
    q.Create(q.Ref(q.Collection('users'), keys.public), {
        data: {
            userName: 'fooooo',
            keys
        }
    })
)
```

```
`{"errors":[{"position":["create","id"],"code":"invalid argument","description":"Number or numeric String expected, non-numeric 'zdbQUQ94Nzxkhguxgw0t/eDhAhxazv+v0DsElbQ0opI=.ed25519' provided."}]}`,
```

See [user authentication in fauna](https://docs.fauna.com/fauna/current/tutorials/authentication/user?lang=javascript)

[create users](https://docs.fauna.com/fauna/current/tutorials/authentication/user.html#create) -- the `credentials.password` field is special -- it is hashed

> When a new user signs up, we can create a new user document that contains their email address and password. More specifically, a BCrypt hash of the user’s password is stored; FaunaDB does not store credentials in plain text.


> When a user wants to login, they would provide their email address and password. Then we use the Login function to authenticate their access, and if valid, provide them with a token that they can use to access resources.

> A token only provides access according to the privileges granted by an [attribute-based access control (ABAC) role](https://docs.fauna.com/fauna/current/security/abac). 

This way security is at the DB layer, not just the applicatino level.

-------------------------------------------

https://docs.fauna.com/fauna/current/tutorials/authentication/user?lang=javascript#create-user-index -- note the
```
{ permissions: { read: 'public' } }
```

--------------------------------------------


Doing the netlify fauna addon
[indexes](https://docs.fauna.com/fauna/current/tutorials/indexes/)

https://docs.fauna.com/fauna/current/integrations/netlify.html

```
netlify addons:create fauna
```

------------------------------------------------

## How to store the secret key

You don't really want a secret to be in the database.

- save the priv key, don't let anyone see it, not even the user. Then use it to sign messages

- use a different priv key & a same-as message with the local user

- don't use a priv key at all, just function as the current pubs do -- saving and replicating messages

--------------------------------------------------------

## How does auth0 work?
Auth0 vs the fauna login

* create an account with invite code
* when you use the invite, check payment $$$

https://auth0.com/blog/deploying-javascript-apps-part-2/

Need to re-make the "client app" and the backend so they use normal stuff like xhr calls. Should make another version of `sbot` that has different method implementations.

* could use a push/pull interface like git






