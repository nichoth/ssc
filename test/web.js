var ssc = require('../web')
var test = require('tape')

test('example', async t => {
    var ks = await ssc.createKeys()
    // console.log('ks', ks)
    t.ok(ks, 'should return a keystore')
    t.end()
})
