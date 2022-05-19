#!/usr/bin/env node
import { createRequire } from 'module';
const require = createRequire(import.meta.url)
const concat = require('concat-stream')
import ssc from './index.js'

const argv = require('minimist')(process.argv.slice(2))

const commands = {
    // print keys to stdout
    // _example:_
    // ./cli.js keys 
    keys: function () {
        ssc.createKeys().then(myKeys => {
            ssc.exportKeys(myKeys.keys).then(exported => {
                exported.did = myKeys.did
                exported.id = myKeys.id
                process.stdout.write(JSON.stringify(exported, null, 2) + '\n')
            })
        })
    },


    // input includes JSON keys piped into stdin
    // also requires a `--text` option in the CLI
    // _example:_
    // ./cli.js keys | ./cli.js post --text "woooo more test"

    // pass in a previous message to create a merkle-list
    // ./cli.js keys | ./cli.js post --text "woooo testing again" --prev="$(cat ./test/cli/message-json.json)"

    // or omit `--prev` to create a message with `null` as previous
    post: function () {
        const sink = concat({ encoding: 'string' }, keys => {
            var prev = argv.prev || null
            const ks = JSON.parse(keys)
            prev = JSON.parse(prev)

            ssc.importKeys({ keys: ks }).then(imported => {
                ssc.createMsg(imported, prev, {
                    type: 'post',
                    text: argv.text || argv.t
                }).then(msg => {
                    process.stdout.write(JSON.stringify(msg, null, 2) + '\n')
                })
            })
        })

        if (!argv.text && !argv.t) {
            return process.stdout.write(usage())
        }

        process.stdin.pipe(sink)
    },

    // _example_
    // cat test/cli/message-json.json | ./cli.js id
    id: function () {
        const sink = concat({ encoding: 'string' }, json => {
            const parsed = JSON.parse(json)
            process.stdout.write(ssc.getId(parsed) + '\n')
        })

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
        Usage instruction go here
    `
}
