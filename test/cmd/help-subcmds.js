#!/usr/bin/env node
/*
 * A test CLI to test `helpSubcmds` usage.
 */

var util = require('util');
var cmdln = require('../../lib/cmdln');

function HS() {
    cmdln.Cmdln.call(this, {
        name: 'hs',
        desc: 'Trying out helpSubcmds',
        helpSubcmds: [
            'help',
            {group: ''},
            'in-empty-group',
            {group: 'Most Excellent Commands'},
            'awesome',
            {group: 'Other Commands', unmatched: true}
        ]
    });
}
util.inherits(HS, cmdln.Cmdln);

HS.prototype.do_awesome = function do_awesome(_subcmd, _opts, _args, cb) {
    console.log('Do awesome.');
    cb();
};
HS.prototype.do_awesome.help = 'Do awesome things.\n' + 'blah blah\n';

HS.prototype.do_in_empty_group = function do_in_empty_group(
    _subcmd,
    _opts,
    _args,
    cb
) {
    console.log('Do in-empty-group.');
    cb();
};
HS.prototype.do_in_empty_group.help = 'Do in-empty-group things.\n';

HS.prototype.do_something_else = function do_something_else(
    _subcmd,
    _opts,
    _args,
    cb
) {
    console.log('Do something-else.');
    cb();
};
HS.prototype.do_something_else.help = 'Do something-else things.\n';

if (require.main === module) {
    cmdln.main(new HS());
}
