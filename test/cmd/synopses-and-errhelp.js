#!/usr/bin/env node
/*
 * A CLI to test `synopses` and `errHelp`.
 */

var p = console.log;
var util = require('util');
var cmdln = require('../../lib/cmdln');

function CLI() {
    cmdln.Cmdln.call(this, {
        name: 'synopses-and-errhelp',
        desc: 'Testing synopses and errHelp'
    });
}
util.inherits(CLI, cmdln.Cmdln);

CLI.prototype.do_a = function (subcmd, opts, args, cb) {
    if (opts.help) {
        this.do_help('help', {}, [subcmd], cb);
        return;
    } else if (args.length != 2) {
        cb(new cmdln.UsageError('incorrect number of args'));
        return;
    }
    console.log('a: opts=%j, arg=%j', opts, args)
    cb();
};
CLI.prototype.do_a.synopses = [
    '{{name}} a [OPTIONS] arg1 arg2',
    '{{name}} a --list-foo'
];
CLI.prototype.do_a.help = 'Do some a.\n\n{{usage}}';
CLI.prototype.do_a.options = [
    {
        names: ['help', 'h'],
        type: 'bool',
        help: 'Show this help.'
    },
    {
        names: ['file', 'f'],
        type: 'string',
        helpArg: 'FILE'
    },
    {
        names: ['list-foo'],
        type: 'bool'
    }
];

if (require.main === module) {
    cmdln.main(new CLI());
}
