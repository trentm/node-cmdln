`node-cmdln` is a node.js helper lib for creating CLI tools with subcommands
(think `git`, `svn`, `zfs`, `brew`, etc.). It is a sister of my earlier
[Python lib for this](https://github.com/trentm/cmdln).

Follow <a href="https://twitter.com/intent/user?screen_name=trentmick" target="_blank">@trentmick</a>
for updates to node-cmdln.


# Usage

You define a subclass of `Cmdln` and subcommands as `do_NAME` methods.
Minimally you could have a "conan.js" as follows:

```javascript
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

Conan.prototype.do_crush = function do_crush(subcmd, opts, args, cb) {
    console.log('Yargh!');
    cb();
};
Conan.prototype.do_crush.help = 'Crush your enemies.';

cmdln.main(new Conan());  // mainline
```

With this, you get the following behaviour:

```bash
$ node examples/conan.js
What is best in life?

Usage:
    conan [OPTIONS] COMMAND [ARGS...]
    conan help COMMAND

Options:
    -h, --help      Show this help message and exit.

Commands:
    help (?)        Help on a specific sub-command.
    crush           Crush your enemies.

$ node examples/conan.js help crush
Crush your enemies.

$ node examples/conan.js crush
Yargh!
```


# Option processing

Option processing (using [dashdash](https://github.com/trentm/node-dashdash))
is integrated. `do_crush` above could be replaced with:

```javascript
Conan.prototype.do_crush = function (subcmd, opts, args, cb) {
    if (opts.help) {
        this.do_help('help', {}, [subcmd], cb);
        return;
    }
    if (!args.length) {
        console.log('No enemies? Yarg!');
    } else {
        args.forEach(function (enemy) {
            console.log('Smite %s with a %s!', enemy, opts.weapon);
        });
    }
    cb();
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
    + '     {{name}} crush [OPTIONS] [ENEMIES...]\n'
    + '\n'
    + '{{options}}'
);
```

Then we get this behaviour:

```bash
$ node examples/conan.js crush Bob
Smite Bob with a sword!

$ node examples/conan.js crush Bob Linda --weapon mattock
Smite Bob with a mattock!
Smite Linda with a mattock!

$ node examples/conan.js crush -h
Crush your enemies.

Usage:
     conan crush [OPTIONS] [ENEMIES...]

Options:
    -h, --help                  Show this help.
    -w WEAPON, --weapon=WEAPON  Weapon with which to smite.
```


See [examples/conan.js](examples/conan.js) for the complete example. Run
`node example/conan.js ...` to try it out.


# Reference

In general, please read the comments in [the source](./lib/cmdln.js) and
[browse the examples](./examples/). The API is far from fully documented here.

## `cmdln.Cmdln`

To use this module you create a class that inherits from `cmdln.Cmdln`; add
some methods to that class that define the tool's commands, options, etc.;
then pass an instance to `cmdln.main()`. Roughly like this:

    function CLI() {
        cmdln.Cmdln.call(this, {<config>});
    }
    util.inherits(CLI, cmdln.Cmdln);
    ...
    var cli = new CLI();
    cmdln.main(cli);

We'll use the `CLI` and `cli` names as used above in the following reference:

- `new Cmdln(<config>)` Create a Cmdln subclass instance. See the block comment
  in the code for full documentation on the `config` options.

- `CLI.prototype.do_<subcmd> = function (subcmd, opts, args, cb)` is how a
  subcommand is defined. How the subcmd is handled can be customize with some
  properties (e.g. `options`, `help`) on the handler function.

- `CLI.prototype.do_<subcmd> = <SubCLI>;` Instead of a function handler for a
  subcommand, a `do_<subcmd>` can be set to another Cmdln subclass to support
  sub-subcommands, like `git remote add|remove|rename|...`. See
  ["examples/fauxgit.js"](./examples/fauxgit.js) for an example.

- `CLI.prototype.do_<subcmd>.aliases = <array of strings>;` to define one or
  more aliases for a command. These aliases are shown in the "Commands:"
  section of the generated help output.

- `CLI.prototype.do_<subcmd>.hiddenAliases = <array of strings>;` to define one
  or more aliases for a command **that are not shown in the generated help
  output**. This can be useful when renaming a subcommand in a new version of
  a tool and still support the old name.

- `CLI.prototype.do_<subcmd>.options = <object>;` is how to set the options
  (in [dashdash](https://github.com/trentm/node-dashdash) format) for that
  subcommand.

- `CLI.prototype.do_<subcmd>.helpOpts = <dashdash helpOpts object>;` to override
  formatting settings for `options` help output for this command. By default
  the `helpOpts` passed into the CLI constructor are used. The set of supported
  helpOpts are defined by
  [dashdash](https://github.com/trentm/node-dashdash#help-config).

- `CLI.prototype.do_<subcmd>.help = <string>;` to set the help string for a
  subcommand.

- `CLI.prototype.do_<subcmd>.help = function (subcmd, opts, args, cb)` is
  an alternate method to handle help for a subcommand. The given function
  will be run when `tool help <subcmd>` is called.

- `CLI.prototype.do_<subcmd>.desc = <string>;` can be set to a short string
  to be used in the `tool help` output to summarize subcmd. If not provided,
  then the first line of `do_<subcmd>.help` will be used.

- `CLI.prototype.do_<subcmd>.hidden = <boolean>;` Set to false to have
  `tool help` output *not* list this subcmd.

- `CLI.prototype.do_<subcmd>.interspersedOptions = <boolean>;` Set to
  false to have `tool <subcmd> ...` not allow interspersed options
  (i.e. options after the first argument).

- `CLI.prototype.do_<subcmd>.allowUnknownOptions = <boolean>;` Set to
  true to have `tool <subcmd> ...` allow unknown options.

- `<Cmdln>.prototype.init(opts, args, cb)` Hook run after option processing
  (`this.opts` is set), but before the subcommand handler is run.

- `<Cmdln>.prototype.fini(subcmd, cb)` Hook run after the subcommand handler is
  run.

- `<Cmdln>.showErrStack` boolean. Set to true to have `cmdln.main()`, if used,
  print a full stack on a shown error. When wanted, this is typically set
  in If you want this option it is typically
  set either

- `<Cmdln>.handlerFromSubcmd(<subcmd>)` will return the appropriate
  `do_<subcmd>` method that handles the given sub-command. This resolves
  sub-command aliases.

- `<Cmdln>.helpFromSubcmd(<subcmd>)` will return the help string for
  that subcmd *or*, if defined, the help function defined for that subcmd.
  This is used by the default `do_help` implementation.


## `cmdln.main()`

This is a convenience method for driving the mainline of your script using
the your defined `Cmdln` subclass. There are a number of options to control
how it works. Read the block comment on that function in "lib/cmdln.js" for
the best docs.


# License

MIT. See LICENSE.txt
