`node-cmdln` is a node.js helper lib for creating CLI tools with subcommands
(think `git`, `svn`, `zfs`, `brew`, etc.). It is a sister of my earlier
[Python lib for this](https://github.com/trentm/cmdln).

Follow <a href="https://twitter.com/intent/user?screen_name=trentmick" target="_blank">@trentmick</a>
for updates to node-cmdln.


# Usage

You define a subclass of `Cmdln` and subcommands as `do_NAME` methods.
Minimally you could have a "conan.js" as follows:

    #!/usr/bin/env node
    var util = require('util');
    var cmdln = require('cmdln');

    function Conan() {
        cmdln.Cmdln.call(this, {
            name: 'conan',
            desc: 'What is best in life?'
        });
    }
    util.inherits(Conan, cmdln.Cmdln);

    Conan.prototype.do_crush = function do_crush(subcmd, opts, args, callback) {
        console.log('Yargh!');
        callback();
    };
    Conan.prototype.do_crush.help = 'Crush your enemies.';

    cmdln.main(Conan);  // mainline

With this, you get the following behaviour:

    $ node conan.js
    What is best in life?

    Usage:
        conan [OPTIONS] COMMAND [ARGS...]
        conan help COMMAND

    Options:
        -h, --help      Show this help message and exit.

    Commands:
        help (?)        Help on a specific sub-command.
        crush           Crush your enemies.

    $ node conan.js help crush
    Crush your enemies.

    $ node conan.js crush
    Yargh!


# Option processing

Option processing (using [dashdash](https://github.com/trentm/node-dashdash))
is integrated. `do_crush` above could be replaced with:

    Conan.prototype.do_crush = function (subcmd, opts, args, callback) {
        console.log('Yargh!');
        callback();
    };
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

Then we get this behaviour:

    $ node conan.js crush Bob
    Smite Bob with a sword!

    $ node conan.js crush Bob Linda --weapon mattock
    Smite Bob with a mattock!
    Smite Linda with a mattock!

    $ node conan.js crush -h
    Crush your enemies.

    Usage:
         conan crush [OPTIONS] [ENEMIES...]

    Options:
        -h, --help                  Show this help.
        -w WEAPON, --weapon=WEAPON  Weapon with which to smite.


See "examples/conan.js" for the complete example. Run
`node example/conan.js ...` to try it out.


# License

MIT. See LICENSE.txt
