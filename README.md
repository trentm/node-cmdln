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
    + '     {{name}} {{cmd}} [OPTIONS] [ENEMIES...]\n'
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


# Bash completion

One can generate Bash completion code for a `Cmdln` subclass via

    cli.bashCompletion()

One possible usage is to add a `completion` subcmd to your CLI:

    CLI.prototype.do_completion = function (subcmd, opts, args, cb) {
        console.log( this.bashCompletion() );
        cb();
    };

and get users to use that to setup Bash completion:

    $ alias conan="node examples/conan.js"
    $ conan completion > conan.completion
    $ source conan.completion

    $ conan <TAB>
    crush      hear       help       pulverize  see        smash
    $ conan -<TAB>
    --help     --verbose  --version  -h         -v         -x
    $ conan crush --weapon <TAB>            # custom 'weapon' completion type
    bow-and-array  mattock        spear          sword
    $ conan crush --weapon spear <TAB>      # custom 'enemy' completion type
    King-Osric    Subotai       Thulsa-Doom   _mbsetupuser  trentm

See the `do_completion` subcommand on "examples/conan.js" for a complete example
of this. See the equivalent in the larger `triton` tool for another example:
<https://github.com/joyent/node-triton/blob/master/lib/do_completion.js>.

Another potential usage could be to pre-generate a completion file and
distribute it with your tool.


# Reference

In general, also please read the comments in [the source](./lib/cmdln.js) and
[browse the examples](./examples/).

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

- `CLI.prototype.do_<subcmd>.synopses = <array of strings>;`
  Set to the synopsis string(s) for this command, i.e. the part typically
  in the "SYNOPSIS" section of a man page. See
  [examples/conan.js](examples/conan.js). This supports some template variables:

    - `{{name}}` becomes `cli.name` (i.e. the tool name).
    - `{{cmd}}` becomes the sub-command name.

  Setting `synopses` can be used (a) for the `{{usage}}` template var in
  subcmd help (see below) and (b) for `errHelp` for `UsageError`s (see below).

- `CLI.prototype.do_<subcmd>.helpOpts = <dashdash helpOpts object>;` to override
  formatting settings for `options` help output for this command. By default
  the `helpOpts` passed into the CLI constructor are used. The set of supported
  helpOpts are defined by
  [dashdash](https://github.com/trentm/node-dashdash#help-config).

- `CLI.prototype.do_<subcmd>.help = <string>;` to set the help string for a
  subcommand. This supports some template variables:

    - `{{name}}` becomes `cli.name` (i.e. the tool name).
    - `{{cmd}}` becomes the sub-command name.
    - `{{usage}}` becomes a "Usage:\n   $synopses" block if `synopses` are
      defined (see above).
    - `{{options}}` becomes a "Options:\n    $option-help" block if `options`
      are provided for the subcmd (see above).

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

- `CLI.prototype.do_<subcmd>.completionArgtypes = <array>;` Set to an array
  of strings to define the [Bash completion](#bash-completion) type for the
  corresponding positional arg. For example, the following:
        MyCLI.prototype.do_foo.completionArgtypes = ['fruit', 'file'];
  would mean that `mycli foo <TAB>` would complete "fruit" (using a
  `complete_fruit` bash function, typically provided via the `specExtra`
  arg to `<cli>.bashCompletion()`) and the second and subsequent positional
  args -- `mycli foo banana <TAB>` -- would use filename completion.

- `CLI.prototype.init(opts, args, cb)` Hook run after option processing
  (`this.opts` is set), but before the subcommand handler is run.

- `CLI.prototype.fini(subcmd, err, cb)` Hook run after the subcommand handler is
  run. Here `err` is the error returned by the invocation of the CLI. This allows
  a `fini` method to use or deal with that error, if necessary. To just
  pass that err on (to the calling `main`) do this:

        CLI.prototype.fini = function fini(subcmd, err, cb) {
            // Whatever finalization you want to do here (possibly with a
            // `finiErr`) ...
            cb(finiErr || err, subcmd);
        };

  (Note: The call signature to `fini` changed in cmdln v3. See the changelog
  in CHANGES.md.)

- `cli.showErrStack` boolean. Set to true to have `cmdln.main()`, if used,
  print a full stack on a shown error. A common pattern of mine is to set
  this in the `.init()` method if a top-level `-v,--verbose` option is given.

- `cli.handlerFromSubcmd(<subcmd>)` will return the appropriate
  `do_<subcmd>` method that handles the given sub-command. This resolves
  sub-command aliases.

- `cli.helpFromSubcmd(<subcmd>)` will return the help string for
  that subcmd *or*, if defined, the help function defined for that subcmd.
  This is used by the default `do_help` implementation.

- `cli.bashCompletion()` generates and returns bash completion for
  the CLI.


## `cmdln.main()`

This is a convenience method for driving the mainline of your script using
the your defined `Cmdln` subclass. There are a number of options to control
how it works. Read the block comment on that function in "lib/cmdln.js" for
the best docs.

## `errHelp` and Errors

cmdln v4 introduced subcmd *synopses*, *`errHelp`*, and some related
functionality to help provide brief automatic command help for some usage
errors. `errHelp` is a brief message after a printed error, giving potentially
helpful info. Some examples from familiar commands (marked here with `>`):

        $ ls -D
        ls: illegal option -- D
    >   usage: ls [-ABCFGHLOPRSTUWabcdefghiklmnopqrstuwx1] [file ...]

        $ git foo
        git: 'foo' is not a git command. See 'git --help'.

    >   Did you mean this?
    >          fo

Use the following suggestions to get this kind of error-help for your commands:

1. Optionally set `synopses` on your subcmd handlers. E.g.:

        do_list.synopses = ['{{name}} list [OPTIONS] FILTERS...'];

   Doing so allows two things: (a) the use of the `{{usage}}` template var
   in your command help, and (b) use of those synopses for `errHelp`.

2. Optionally use the `{{usage}}` template var in your command help. E.g.:

        do_list.help = [
            'List instances.',
            '',
            '{{usage}}',
            '',
            '{{options}}'
        ].join('\n');

3. Optionally use the `cmdln.UsageError` error class for usage errors in
   your subcmds. E.g.:

        function do_list(subcmd, opts, args, callback) {
            // ...
            } else if (args.length < 1) {
                callback(new cmdln.UsageError('missing FILTER args'));
                return;
            }

4. Use `cmdln.main()` for your mainline

   This will now attempt to determine `errHelp` from any returned error and
   print it on stderr -- use `options.showErrHelp=false` to disable. Or if
   you are not using `cmdln.main()`, then you can use
   `cmdln.errHelpFromErr(err)` to get errHelp to print, if you like.

Error help is determined by calling `err.cmdlnErrHelpFromErr()`, which is
implemented for cmdln's error classes:

- `cmdln.OptionError`: Show a synopsis of the command's options.
- `cmdln.UsageError`: Show the command's synopses, if available.
- `cmdln.UnknownCommandError`: List possible fuzzy matches.

You can implement that method for custom error classes if you like.


## `cmdln.dashdash`

This is a re-export of the [dashdash](https://github.com/trentm/node-dashdash)
option processing module that cmdln is using. This is exported so that calling
code can add option *types* if wanted, via `cmdln.dashdash.addOptionType`. E.g.,

    var cmdln = require('cmdln');

    function parseCommaSepStringNoEmpties(option, optstr, arg) {
        return arg.trim().split(/\s*,\s*/g)
            .filter(function (part) { return part; });
    }

    cmdln.dashdash.addOptionType({
        name: 'commaSepString',
        takesArg: true,
        helpArg: 'STRING',
        parseArg: parseCommaSepStringNoEmpties
    });

    // ...


See [the node-dashdash documentation](https://github.com/trentm/node-dashdash#custom-option-types)
for details.


# License

MIT. See LICENSE.txt
