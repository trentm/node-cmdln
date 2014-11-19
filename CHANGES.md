# node-cmdln Changelog

## 3.0.1 (not yet released)

- Allow one to override how option help is formatted for a subcmd by setting
  `CLI.prototype.do_<subcmd>.helpOpts = <dashdash helpOpts object>;`. See
  supported helpOpts in [the dashdash help config
  docs](https://github.com/trentm/node-dashdash#help-config).

- Update to latest dashdash (1.7.1).


## 3.0.0

- [Backward incompatible change] Change the signature of a `<cmdln>.fini` method
  from:

        MyCLI.prototype.fini = function fini(subcmd, cb) {

  to:

        MyCLI.prototype.fini = function fini(subcmd, err, cb) {

  where `err` is the error returned by the invocation of the CLI. This allows
  a `fini` method to use or deal with that error, if necessary.

- Update `cmdln.main(...)` to support a `showErr` boolean as an option or
  on the `<Cmdln>` instance. For example, this could allow a `fini` method
  to suppress printing an error. By default errors from subcommands are shown
  (i.e. the same current behaviour by default).


## 2.1.3

- Update deps to latest (in particular to get a extsprintf version without
  accidentally large included files).


## 2.1.2

- Only use the *first line* of `<SubCmdln instance>.desc` for the sub-command
  list help output for a sub-subcommand handler.


## 2.1.1

- Make sure to carry over all properties set on a sub-subcommand handler class
  to the implicit handler function created.  E.g., `myCustomFlag` in the
  following:

        Git.prototype.do_remote = GitRemote;
        Git.prototype.do_remote.myCustomFlag = true;


## 2.1.0

- Support sub-subcommands (like `git remote add|rename|remove ...`) simply by
  setting `do_<subcmd>` to another `Cmdln` subclass for the subcommand.
  Basically like this:

        function GitRemote(parent) {
            this.parent = parent;
            Cmdln.call(this, {
                name: 'git remote',
                // ...
            });
        }
        util.inherits(GitRemote, Cmdln);

        GitRemote.prototype.emptyLine = function (cb) {
            // ... implement `git remote`
        };

        GitRemote.prototype.do_add = function (subcmd, opts, args, cb) {
            // ... implment `git remote add`
            cb();
        };


        function Git() {
            Cmdln.call(this, {
                name: 'git',
                // ...
            });
        }
        util.inherits(Git, Cmdln);

        Git.prototype.do_remote = GitRemote;

  See [examples/fauxgit.js](./examples/fauxgit.js) for a more complete example.


## 2.0.0

- Improvements to the `cmdln.main()` function:

    - The call signature has changed to take a Cmdln subclass *instance*
      rather than the constructor function. This allows one to initialize
      it with parameters if necessary. The new signature is:

            function main(<cli-instance>, <options>)

    - Added the `options.showErrStack` option to force the printing of the full
      error stack for a shown exit error. Instead, `<cli>.showErrStack` can
      be set true to show the full stack on error. One can use the latter
      to control error stack printing in the `<cli>.init()` method, e.g. from
      a --verbose option or an envvar (see [this test
      command](./test/cmd/main-opts.js#L24) for an example).

    - The default handling of `NoCommandError`, i.e. calling the CLI with no
      subcommand, has changed to **not** show an error string (a la `git`,
      `brew` and others). The new `options.showNoCommandErr` option was added.
      Set it to true to get the old behaviour.

  Note on backward compatibility: If the old call signature is used, then
  `cmdln.main()` will function as before. However, please upgrade to the
  new form. From this:

        cmdln.main(CLI, argv, options);  # old

  to this:

        var cli = new CLI();
        cmdln.main(cli, {argv: argv, ...other options...});  # new

- Add `<Cmdln>.fini(...)` hook method run after a subcommand handler -- to
  complement `<Cmdln>.init(...)`.

- Reduce the npm package size (drop tests, examples, build tools, etc.)


## 1.3.3

- Update to dashdash@1.6.0 (and other deps).


## 1.3.2

- Add `<Cmdln>.handlerFromSubcmd(<subcmd>)` hook. For example this could allow
  a user's Cmdln subclass to lookup attributes on the handler functions
  during `<Cmdln>.init()`.

- Don't `process.exit(0)` in `cmdln.main` for success to allow open listeners
  to continue.


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
