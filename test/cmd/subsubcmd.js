#!/usr/bin/env node
/*
 * A CLI to test two-level subcommands, i.e. like `git remote add ...`.
 */

var p = console.log;
var util = require('util');
var cmdln = require('../../lib/cmdln'),
    Cmdln = cmdln.Cmdln;


//---- sub CLI for `git remote`

function Sub(parent) {
    this.top = parent;
    Cmdln.call(this, {
        name: 'top sub',
        desc: 'sub desc',
        options: [
            {names: ['s'], type: 'bool', default: false, help: 'hiss'},
        ]
    });
}
util.inherits(Sub, Cmdln);

Sub.prototype.emptyLine = function (cb) {
    p('top sub: top.opts.verbose=%s sub.opts.s=%s',
      this.top.opts.verbose, this.opts.s);
    cb();
};

Sub.prototype.do_bleep = function (subcmd, opts, args, cb) {
    p('top sub bleep: top.opts.verbose=%s sub.opts.s=%s opts.t=%s args=%s',
      this.top.opts.verbose, this.opts.s, opts.t, args);
    cb();
};
Sub.prototype.do_bleep.options = [
    {
        names: ['t'],
        helpArg: '<t-arg>',
        type: 'string',
        help: 'choose your t'
    }
];
Sub.prototype.do_bleep.help = (
    'sub bleep help\n'
    + '\n'
    + '{{options}}'
);

Sub.prototype.do_bloop = function (subcmd, opts, args, cb) {
    p('top sub bloop');
    cb();
};
Sub.prototype.do_bloop.help = 'sub bloop help';
Sub.prototype.do_bloop.hidden = true;  /* hide from summary of commands */


function Top() {
    Cmdln.call(this, {
        name: 'top',
        desc: 'top-level CLI',
        options: [
            {names: ['verbose', 'v'], type: 'bool', default: false}
        ]
    });
}
util.inherits(Top, Cmdln);

Top.prototype.do_blah = function (subcmd, opts, args, cb) {
    p('top blah: args=%s', args);
    cb();
};
Top.prototype.do_blah.help = 'blah help';


Top.prototype.do_completion = function (subcmd, opts, args, cb) {
    console.log(this.bashCompletion());
    cb();
};
Top.prototype.do_completion.hidden = true;


Top.prototype.do_sub = Sub;



//---- mainline

if (require.main === module) {
    cmdln.main(new Top());
}
