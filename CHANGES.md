# node-cmdln Changelog

## 1.3.1

- Add `helpBody` optional param to `Cmdln` constructor. This is string content
  that will be included at the help of automatic help output.


## 1.3.0

- Add a `Cmdln.emptyLine` hook that is called when no argv is given, i.e.
  when your command is called with no args:

        $ mycmd

  The default behaviour (as before) is to print help output.
  A **change in default behaviour** is that this will now exit non-zero. If
  you want different behaviour, then override `emptyLine()` in your Cmdln
  subclass.

- Improve the `cmdln.main` convenience function's printing of error messages.
  An `options.showCode` has been added to allow printing error instances'
  `code` attribute, if defined. E.g., with this usage:

        cmdln.main(MyCmd, process.argv, {showCode: true});

  You get this output for errors (in this example the error is an unknown
  subcommand):

        $ node mycmd.js bogus
        mycmd bogus: error (UnknownCommand): unknown command: "bogus"


## 1.2.2

- Fix `{{name}}`-replacement in subcmd help templates: all {{name}} usages
  are replaced. Change from using the *subcommand* name as the value of
  `{{name}}` to the *tool name* (i.e. the top-level command name).


## 1.2.1

- Pass the `subcmd` back as the second arg in the `<cli>.main` callback. This
  enabled the subcmd to be quoted in an error message if there was an `err`
  returned. E.g.:

        var cli = new Mo();
        cli.main(process.argv, function (err, subcmd) {
            if (err) {
                var subcmdStr = subcmd ? ' ' + subcmd : '';    // <---- HERE
                if (err.body && err.body.code) {
                    console.error('%s%s: error (%s): %s', cli.name, subcmdStr,
                        err.body.code, err.message);
                } else {
                    console.error('%s%s: error: %s', cli.name, subcmdStr,
                        err.message);
                }
                if (cli.opts.verbose && err.stack) {
                    console.error('\n' + err.stack);
                }
                process.exit(1);
            } else {
                process.exit(0);
            }
        });


## 1.2.0

- [Backward incompatible change] Underscores in sub-command `do_*` methods
  are translated to hyphens for the sub-command name. This means you can
  have sub-commands with hyphens, at the cost of not allowing underscores.

  A sub-command method like this:

        MyCmdln.prototype.do_foo_bar

  results in a 'foo-bar' sub-command.

  Shout if this breaks you. I could see about making this configurable.


## 1.1.4

- Update to [dashdash
  1.3.2](https://github.com/trentm/node-dashdash/blob/master/CHANGES.md#132):
  fix a subtlety with an option using all of `type: 'bool'`, `default` and
  `env` (IOW, rare).


## 1.1.3

- Update to [dashdash
  1.3.1](https://github.com/trentm/node-dashdash/blob/master/CHANGES.md#131):
  fix 'env' not working for options with a 'default'.


## 1.1.2

- Update to [dashdash
  1.3.0](https://github.com/trentm/node-dashdash/blob/master/CHANGES.md#130):
  interp boolean envvar '0' as false


## 1.1.1

- Update to [dashdash
  1.2.0](https://github.com/trentm/node-dashdash/blob/master/CHANGES.md#120):
  envvar integration, '--dry-run' -> `opts.dry_run`.


## 1.1.0

- Add `cmdln.main` for simpler mainline usage, e.g.:

        function MyTool() {
            // ...
        }
        util.inherits(MyTool, cmdln.Cmdln);

        // ...

        if (require.main === module) {
            cmdln.main(MyTool);
        }

- Drop support for 'help_FOO' help commands. Not worth the complexity.

- Allow custom options given in constructor and a `Cmdln.prototype.init`
  hook that is called to handle the top-level options after they are
  parsed out and before subcmd dispatch. See "examples/conan.js" for
  an example.

- Top-level options are put on `this.opts` for use by subcmds.


## 1.0.2

- Update to [dashdash
  1.0.2](https://github.com/trentm/node-dashdash/blob/master/CHANGES.md#102).

- Start a test suite.


## 1.0.1

- Fix for a subcmd calling `do_help` on itself.


## 1.0.0

First release.
