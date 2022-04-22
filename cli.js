#!/usr/bin/env node
import { createRequire } from 'module';
const require = createRequire(import.meta.url)
const concat = require('concat-stream')

var argv = require('minimist')(process.argv.slice(2))
import ssc from './index.js'

// console.log('argv', argv)

const commands = {
    keys: function () {
        ssc.createKeys().then(myKeys => {
            ssc.exportKeys(myKeys.keys).then(exported => {
                exported.did = myKeys.did
                exported.id = myKeys.id
                process.stdout.write(JSON.stringify(exported, null, 2) + '\n')
            })
        })
    },

    // input includes JSON keys piped into this command
    // also requires a `--text` option in the CLI
    // example:
    // ./cli.js keys | ./cli.js post --text "woooo more test"
    post: function () {
        const sink = concat({ encoding: 'string' }, keys => {
            var prev = argv.prev || null

            const ks = JSON.parse(keys)

            ssc.importKeys({ keys: ks }).then(imported => {
                ssc.createMsg(imported, prev, {
                    type: 'post',
                    content: argv.text
                }).then(msg => {
                    // console.log('****msg', msg)
                    process.stdout.write(JSON.stringify(msg, null, 2) + '\n')
                })
            })
        })

        if (!argv.text && !argv.t) {
            return process.stdout.write(usage())
        }

        process.stdin.pipe(sink)
    }
}

const cmd = argv._[0]

if (commands[cmd]) {
    commands[cmd]()
} else {
    process.stdout.write(usage())
}

function usage () {
    return `
        usage instructions here
    `
}
