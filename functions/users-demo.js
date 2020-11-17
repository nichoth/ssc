var faunadb = require('faunadb')
var q = faunadb.query
var key = process.env.FAUNA_KEY

var client = new faunadb.Client({
    secret: key
})

client.query(
    // takes the id of the user: '1'
    q.Create(q.Ref(q.Collection('users'), '1'), {
        data: {
            userName: 'fooooo'
        }
    })
)
.then(res => console.log('res', res))
.catch(err => console.log('errrrr', err))

