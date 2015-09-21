#!/usr/bin/env node
/*
 * A test CLI to test the '{{cmd}}' help template var.
 */

var p = console.log;
var util = require('util');
var cmdln = require('../../lib/cmdln');

function CLI() {
    cmdln.Cmdln.call(this, {
        name: 'cmd-template-var',
        desc: 'Trying out {{cmd}} template var'
    });
}
util.inherits(CLI, cmdln.Cmdln);

CLI.prototype.do_awesome = function (subcmd, opts, args, cb) {
    console.log('Do awesome.')
    cb();
};
CLI.prototype.do_awesome.help = 'Usage: {{name}} {{cmd}} ...';

CLI.prototype.do_lame = function (subcmd, opts, args, cb) {
    console.log('Do lame.')
    cb();
};
CLI.prototype.do_lame.help = 'Usage: {{name}} {{cmd}} ...';

if (require.main === module) {
    cmdln.main(new CLI());
}
