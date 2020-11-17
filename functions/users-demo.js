var ssbKeys = require("ssb-keys")
var faunadb = require('faunadb')
var q = faunadb.query
var envKey = process.env.FAUNA_KEY

var keys = ssbKeys.generate()

var client = new faunadb.Client({
    secret: envKey
})

client.query(
    // pass the id for the user: '1'
    // q.Create(q.Ref(q.Collection('users'), '1'), {
    q.Create(q.Collection('users'), {
        data: {
            userName: 'fooooo',
            secrets: keys
        }
    })
)
    .then(res => console.log('res', res))
    .catch(err => console.log('errrrr', err))

