var faunadb = require('faunadb')
var q = faunadb.query
var envKey = process.env.FAUNA_KEY

var client = new faunadb.Client({ secret: envKey })

client.query(
    q.CreateIndex({
        name: 'My-index',
        source: q.Collection('users'),
        terms: [{ field: ['data', 'secrets', 'public'] }]
        // values: [{ field: ['data', 'secrets', 'public'] }]
    })
)
    .then(res => console.log('res', res))
    .catch(err => console.log('errrrr', err))


