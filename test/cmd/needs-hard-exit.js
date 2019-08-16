#!/usr/bin/env node
/*
 * A CLI to test out using `finale` option to `cmdln.main()`.
 */

var util = require('util');
var cmdln = require('../../lib/cmdln');

/*
 * An active handle that will keep a node process alive, unless you call
 * `process.exit()`.
 */
setInterval(function in30s() {
    console.error('needs-hard-exit.js: interval still running');
}, 30000);

function CLI() {
    cmdln.Cmdln.call(this, {
        name: 'needs-hard-exit',
        desc: 'Test out cmdln.main() "finale" option.'
    });
}
util.inherits(CLI, cmdln.Cmdln);

if (require.main === module) {
    cmdln.main(new CLI(), {
        argv: process.env.MAIN_OPTS_ARGV
            ? process.env.MAIN_OPTS_ARGV.split(',')
            : undefined,
        finale: 'exit'
    });
}
