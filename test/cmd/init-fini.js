#!/usr/bin/env node
/*
 * A CLI to test `Cmdln.init()` and `Cmdln.fini()`.
 */

var p = console.log;
var util = require('util');
var cmdln = require('../../lib/cmdln');

function CLI() {
    cmdln.Cmdln.call(this, {
        name: 'init-fini'
    });
}
util.inherits(CLI, cmdln.Cmdln);

CLI.prototype.init = function init(_opts, _args, _callback) {
    p('ran init');
    cmdln.Cmdln.prototype.init.apply(this, arguments);
};

CLI.prototype.fini = function fini(subcmd, _err, callback) {
    p('ran fini:', subcmd);
    callback();
};

CLI.prototype.do_hi = function do_hi(_subcmd, _opts, _args, callback) {
    p('hi');
    callback();
};

if (require.main === module) {
    cmdln.main(new CLI());
}
