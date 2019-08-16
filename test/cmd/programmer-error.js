#!/usr/bin/env node
/*
 * A CLI to ensure cmdln.js doesn't swallow exceptions from programmer
 * errors in `do_*` handlers -- as it did up to an including v4.
 *
 * See <https://github.com/trentm/node-cmdln/issues/12>
 */

var assert = require('assert-plus');
var p = console.log;
var util = require('util');
var cmdln = require('../../lib/cmdln');

function someHelperFunction(cb) {
    assert.func(cb, 'cb');
    setTimeout(cb, 1000);
}

function CLI() {
    cmdln.Cmdln.call(this, {
        name: 'programmer-error'
    });
}
util.inherits(CLI, cmdln.Cmdln);

CLI.prototype.fini = function (subcmd, err, callback) {
    p('ran fini:', subcmd);
    callback();
};

CLI.prototype.do_hi = function (subcmd, opts, args, callback) {
    // This is a programmer error: forgot to pass cb function.
    someHelperFunction();

    callback();
};

CLI.prototype.help_foo = function (subcmd, opts, args, callback) {
    // This is a programmer error: forgot to pass cb function.
    //someHelperFunction();

    callback();
};

if (require.main === module) {
    cmdln.main(new CLI());
}
