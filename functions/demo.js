var faunadb = require('faunadb'),
var q = faunadb.query;
var key = process.env.FAUNA_KEY

var adminClient = new faunadb.Client({
    secret: key
})

