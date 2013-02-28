/*
 * A `conan` CLI.
 */

var p = console.log;
var util = require('util');
var Cmdln = require('../lib/cmdln').Cmdln;

function Conan() {
    Cmdln.call(this, {
        name: 'conan',
        desc: 'What is best in life?'
    });
}
util.inherits(Conan, Cmdln);


var crushActionFromWeapon = {
    sword: 'Slash',
    spear: 'Pierce',
    maul: 'Crush'
};
Conan.prototype.do_crush = function (subcmd, opts, args, callback) {
    if (opts.help) {
        self.do_help(subcmd, opts, args, callback);
        return;
    }
    if (!args.length) {
        console.log('No enemies? Yarg!');
    } else {
        var action = crushActionFromWeapon[opts.weapon] || 'Punch';
        args.forEach(function (enemy) {
            console.log('%s %s!', action, enemy);
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
        help: 'Weapon with which to crush. One of: '
            + Object.keys(crushActionFromWeapon).join(', ')
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
