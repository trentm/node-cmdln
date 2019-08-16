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

CLI.prototype.do_abc = function(subcmd, opts, args, cb) {
    if (opts.help) {
        this.do_help('help', {}, [subcmd], cb);
        return;
    } else if (args.length != 2) {
        cb(new cmdln.UsageError('incorrect number of args'));
        return;
    }
    console.log('abc: opts=%j, arg=%j', opts, args);
    cb();
};
CLI.prototype.do_abc.synopses = [
    '{{name}} abc [OPTIONS] arg1 arg2',
    '{{name}} abc --list-foo'
];
CLI.prototype.do_abc.help = 'Do some abc.\n\n{{usage}}';
CLI.prototype.do_abc.options = [
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
