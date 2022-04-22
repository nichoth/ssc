#!/usr/bin/env node
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

var argv = require('minimist')(process.argv.slice(2));
import ssc from './index.js'

// console.log('argv', argv)

const cmd = argv._[0]

if (cmd === 'createKeys') {
    ssc.createKeys().then(myKeys => {
        ssc.exportKeys(myKeys.keys).then(exported => {
            exported.did = myKeys.did
            exported.id = myKeys.id
            process.stdout.write(JSON.stringify(exported, null, 2) + '\n')
        })
    })
}
