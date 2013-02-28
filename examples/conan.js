/*
 * A `conan` CLI.
 */

var util = require('util');
var Cmdln = require('../lib/cmdln').Cmdln;

function Conan() {
    Cmdln.call(this, {
        name: 'conan',
        desc: 'What is best in life?'
    });
}
util.inherits(Conan, Cmdln);


Conan.prototype.do_crush = function (subcmd, opts, args, callback) {
    if (opts.help) {
        this.do_help('help', {}, [subcmd], callback);
        return;
    }
    if (!args.length) {
        console.log('No enemies? Yarg!');
    } else {
        args.forEach(function (enemy) {
            console.log('Smite %s with a %s!', enemy, opts.weapon);
        });
    }
    callback();
};
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
    + '     conan crush [OPTIONS] [ENEMIES...]\n'
    + '\n'
    + '{{options}}'
);


Conan.prototype.do_see = function (subcmd, opts, args, callback) {
    callback();
};
Conan.prototype.do_see.help = 'See them driven before you.'

Conan.prototype.do_hear = function (subcmd, opts, args, callback) {
    callback();
};
Conan.prototype.do_hear.help = 'Hear the lamentation of their women.'



function main(argv) {
    var cli = new Conan();
    cli.main(argv, function (err) {
        if (err) {
            console.error('conan: error: %s',
                process.env.DEBUG && err.stack || err);
            process.exit(1);
        }
        process.exit(0);
    });
}

if (require.main === module) {
    main(process.argv);
}
