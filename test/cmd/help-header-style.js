#!/usr/bin/env node
/*
 * A CLI to test usage of the feature to change the generated help output
 * header style. I.e. change the default "Commands", "Options", etc.
 *
 * See: <https://github.com/trentm/node-cmdln/issues/19>
 */

var p = console.log;
var util = require('util');
var cmdln = require('../../lib/cmdln'),
    Cmdln = cmdln.Cmdln;

function CLI() {
    Cmdln.call(this, {
        name: 'help-header-style',
        options: [{names: ['verbose', 'v'], type: 'bool', default: false}],
        strings: {
            helpHeaderUsage: 'USAGE',
            helpHeaderOptions: 'OPTIONS',
            helpHeaderCommands: 'COMMANDS'
        }
    });
}
util.inherits(CLI, Cmdln);

CLI.prototype.do_blah = function do_blah(_subcmd, _opts, _args, cb) {
    p('blah blah');
    cb();
};
CLI.prototype.do_blah.options = [
    {
        names: ['t'],
        type: 'bool',
        help: 'have some tea'
    }
];
CLI.prototype.do_blah.synopses = ['{{name}} {{cmd}} [-t]'];
CLI.prototype.do_blah.help = [
    'Blah blah',
    '',
    '{{usage}}',
    '',
    '{{options}}'
].join('\n');

// ---- mainline

if (require.main === module) {
    cmdln.main(new CLI());
}
