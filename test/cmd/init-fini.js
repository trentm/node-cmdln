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

CLI.prototype.init = function(opts, args, callback) {
    p('ran init');
    cmdln.Cmdln.prototype.init.apply(this, arguments);
};

CLI.prototype.fini = function(subcmd, err, callback) {
    p('ran fini:', subcmd);
    callback();
};

CLI.prototype.do_hi = function(subcmd, opts, args, callback) {
    p('hi');
    callback();
};

if (require.main === module) {
    cmdln.main(new CLI());
}
