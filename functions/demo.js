var faunadb = require('faunadb')
var q = faunadb.query
var key = process.env.FAUNA_KEY

var client = new faunadb.Client({
    secret: key
})

client.query(
    q.Create(q.Collection('posts'), {
        data: {
            title: 'What I had for breakfast...'
        }
    })
)
    .then(res => console.log('res', res))
    .catch(err => console.log('errr', err))

