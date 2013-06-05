# node-cmdln Changelog

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
