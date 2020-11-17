var ssbKeys = require("ssb-keys")
var faunadb = require('faunadb')
var q = faunadb.query
var envKey = process.env.FAUNA_KEY

var keys = ssbKeys.generate()

var client = new faunadb.Client({
    secret: envKey
})

client.query(
    // takes the id of the user: '1'
    // q.Create(q.Ref(q.Collection('users'), '1'), {
    q.Create(q.Collection('users'), {
        data: {
            userName: 'fooooo',
            keys
        }
    })
)
.then(res => console.log('res', res))
.catch(err => console.log('errrrr', err))

