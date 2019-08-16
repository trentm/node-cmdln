#!/usr/bin/env node
/*
 * A CLI to test out `cmdln.main()` opts.
 */

var util = require('util');
var cmdln = require('../../lib/cmdln');

function CLI() {
    cmdln.Cmdln.call(this, {
        name: 'main-opts',
        desc: 'Test out cmdln.main() options.',
        options: [
            {
                name: 'verbose',
                type: 'bool',
                help: 'See this.showErrStack=true to test that.'
            }
        ]
    });
}
util.inherits(CLI, cmdln.Cmdln);

CLI.prototype.init = function init(opts, _args, _callback) {
    if (opts.verbose) {
        this.showErrStack = true;
    }
    cmdln.Cmdln.prototype.init.apply(this, arguments);
};

if (require.main === module) {
    cmdln.main(new CLI(), {
        argv: process.env.MAIN_OPTS_ARGV
            ? process.env.MAIN_OPTS_ARGV.split(',')
            : undefined,
        showNoCommandErr: Boolean(process.env.MAIN_OPTS_SHOW_NO_COMMAND_ERR),
        showCode: Boolean(process.env.MAIN_OPTS_SHOW_CODE),
        showErrStack: process.env.MAIN_OPTS_SHOW_ERR_STACK
            ? Boolean(process.env.MAIN_OPTS_SHOW_ERR_STACK)
            : undefined
    });
}
