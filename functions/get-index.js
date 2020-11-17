var faunadb = require('faunadb')
var q = faunadb.query
var key = process.env.FAUNA_KEY

var client = new faunadb.Client({
    secret: key
})

var userId = 'zhyS3C1K1ixjBSIy9ezwAbsI877ol61uza8fnP8RFXk=.ed25519'

client.query(
    q.Paginate(
        q.Match(q.Index('My-index'), userId)
    )
)
    .then(res => console.log('res', res))
    .catch(err => console.log('errr', err))
