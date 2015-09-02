#!/usr/bin/env node
/*
 * A `conan` CLI. See the README for an intro here.
 */

var p = console.log;
var util = require('util');
var cmdln = require('../lib/cmdln'),
    Cmdln = cmdln.Cmdln;

var VERSION = '1.0.0';

function Conan() {
    Cmdln.call(this, {
        name: 'conan',
        desc: 'What is best in life?',
        // Custom options. By default you get -h/--help.
        options: [
            {names: ['help', 'h'], type: 'bool', help: 'Print help and exit.'},
            {names: ['verbose', 'v'], type: 'bool', help: 'Verbose output.'},
            {name: 'version', type: 'bool', help: 'Print version and exit.'},
            {name: 'x', type: 'bool', help: 'Be more excited about it.'}
        ]
    });
}
util.inherits(Conan, Cmdln);

// Custom `init` to handle custom options (i.e. 'version' defined above).
Conan.prototype.init = function (opts, args, callback) {
    if (opts.version) {
        p(this.name, VERSION);
        callback(false);
        return;
    }
    if (opts.verbose) {
        this.showErrStack = true;
    }
    // Cmdln class handles `opts.help`.
    Cmdln.prototype.init.apply(this, arguments);
};


Conan.prototype.do_crush = function (subcmd, opts, args, callback) {
    if (opts.help) {
        this.do_help('help', {}, [subcmd], callback);
        return;
    }
    // `this.opts` holds the global options. Here we use '-x'.
    var x = (this.opts.x ? ' Yarg!' : '');
    if (!args.length) {
        console.log('No enemies?%s', x);
    } else {
        args.forEach(function (enemy) {
            console.log('Smite %s with a %s!%s', enemy, opts.weapon, x);
        });
    }
    callback();
};
Conan.prototype.do_crush.aliases = [ 'smash' ];
Conan.prototype.do_crush.hiddenAliases = [ 'pulverize' ];
Conan.prototype.do_crush.options = [
    {
        names: ['help', 'h'],
        type: 'bool',
        help: 'Show this help.'
    },
    {
        names: ['weapon', 'w'],
        helpArg: 'WEAPON',
        type: 'string',
        default: 'sword',
        help: 'Weapon with which to smite.'
    }
];
Conan.prototype.do_crush.help = (
    'Crush your enemies.\n'
    + '\n'
    + 'Usage:\n'
    + '     {{name}} crush [OPTIONS] [ENEMIES...]\n'
    + '\n'
    + '{{options}}'
);

Conan.prototype.do_completion = function (subcmd, opts, args, callback) {
    this.bashCompletion();
    callback();
};

Conan.prototype.do_completion.help = (
    'Print bash completion.\n'
    + '\n'
    + 'Usage:\n'
    + '     {{name}} completion\n'
    + '\n'
    + '{{options}}'
);

Conan.prototype.do_see = function (subcmd, opts, args, callback) {
    var x = (this.opts.x || opts.x ? ' Yarg!' : '');
    if (args.length) {
        args.forEach(function (arg) {
            console.log('I see %s.%s', arg, x);
        })
    } else {
        console.log('I see nothing.%s', x);
    }
    callback();
};
Conan.prototype.do_see.help = (
    'See them driven before you.\n'
    + '\n'
    + 'Usage:\n'
    + '     {{name}} see [OPTIONS] [ENEMIES...]\n'
    + '\n'
    + '{{options}}'
);
Conan.prototype.do_see.options = [
    {name: 'x', type: 'bool', help: 'Be more excited about it.'}
];

Conan.prototype.do_hear = function (subcmd, opts, args, callback) {
    console.log('I hear %s.', args.join(' '));
    callback();
};
Conan.prototype.do_hear.help = 'Hear the lamentation of their women.'
// Explicitly empty opts to do option processing.
Conan.prototype.do_hear.options = [];


if (require.main === module) {
    cmdln.main(new Conan());
}
