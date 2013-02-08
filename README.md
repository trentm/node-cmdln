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
    var Cmdln = require('cmdln').Cmdln;

    function Conan(options) {
        Cmdln.call(this, options);
    }
    util.inherits(Conan, Cmdln);
    Conan.prototype.description = 'What is best in life?';

    Conan.prototype.do_crush = function do_crush(subcmd, opts, args, callback) {
        console.log('Yargh!');
        callback();
    };
    Conan.prototype.do_crush.description = 'Crush your enemies.';

    // mainline
    var cli = new Conan();
    cli.main(process.argv, function (err) {
        if (err) {
            console.error('conan: error: %s', err);
            process.exit(1);
        }
        process.exit(0);
    });

With this, you get the following behaviour:

    $ node conan.js
    What is best in life?

    Usage:
        conan [<options>] <command> [<args>...]
        conan help <command>

    Options:
        -h, --help          Show this help message and exit.

    Commands:
        help (?)            Give detailed help on a specific sub-command.
        crush               Crush your enemies.

    $ node conan.js help crush
    Crush your enemies.

    $ node conan.js crush
    Yargh!

Not much yet. Option processing and help output templating to come. See
"examples/conan.js" for a larger example.
