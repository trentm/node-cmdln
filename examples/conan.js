/*
 * A `conan` CLI.
 */

var util = require('util');
var Cmdln = require('../lib/cmdln').Cmdln;

function Conan(options) {
    Cmdln.call(this, options);
}
util.inherits(Conan, Cmdln);
Conan.prototype.description = 'What is best in life?';


Conan.prototype.do_crush = function do_crush(subcmd, opts, args, callback) {
    var action = {
        sword: 'Swipe',
        spear: 'Pierce',
        maul: 'Crush',
    }[opts.weapon] || 'Punch';
    args.forEach(function (enemy) {
        console.log('%s %s!', action, enemy);
    });
    callback();
};
Conan.prototype.do_crush.description = 'Crush your enemies.';
Conan.prototype.do_crush.longOpts = {
    'weapon': String
};
Conan.prototype.do_crush.shortOpts = {
    'w': ['--weapon']
};

Conan.prototype.do_see = function (subcmd, opts, args, callback) {
    callback();
};
Conan.prototype.do_see.description = 'See them driven before you.'

Conan.prototype.do_hear = function (subcmd, opts, args, callback) {
    callback();
};
Conan.prototype.do_hear.description = 'Hear the lamentation of their women.'



function main(argv) {
    var cli = new Conan();
    cli.main(argv, function (err) {
        if (err) {
            console.error('conan: error: %s', err);
            process.exit(1);
        }
        process.exit(0);
    });
}

if (require.main === module) {
    main(process.argv);
}
