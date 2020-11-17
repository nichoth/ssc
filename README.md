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

[create users](https://docs.fauna.com/fauna/current/tutorials/authentication/user.html#create) -- the `credentials.password` field is special 

> When a new user signs up, we can create a new user document that contains their email address and password. More specifically, a BCrypt hash of the user’s password is stored; FaunaDB does not store credentials in plain text.


> When a user wants to login, they would provide their email address and password. Then we use the Login function to authenticate their access, and if valid, provide them with a token that they can use to access resources.


[indexes](https://docs.fauna.com/fauna/current/tutorials/indexes/)



