#!/usr/bin/env node
/*
 * A CLI to test out old v1.x `cmdln.main()` signature and semantics.
 */

var p = console.log;
var util = require('util');
var cmdln = require('../../lib/cmdln');

function CLI() {
    cmdln.Cmdln.call(this, {
        name: 'bwcompat-main-v1',
        desc: 'Test out old v1 cmdln.main().'
    });
}
util.inherits(CLI, cmdln.Cmdln);

CLI.prototype.init = function (opts, args, callback) {
    if (opts.verbose) {
        this.showErrStack = true;
    }
    cmdln.Cmdln.prototype.init.apply(this, arguments);
};

if (require.main === module) {
    cmdln.main(CLI,
        (process.env.BWCOMPAT_MAIN_V1_ARGV
            ? process.env.BWCOMPAT_MAIN_V1_ARGV.split(',') : undefined),
        {
            showCode: (process.env.BWCOMPAT_MAIN_V1_SHOW_CODE
                ? Boolean(process.env.BWCOMPAT_MAIN_V1_SHOW_CODE) : undefined)
        }
    );
}
