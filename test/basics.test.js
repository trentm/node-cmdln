/*
 * Basic node-cmdln tests.
 */

var path = require('path');
var format = require('util').format;
var exec = require('child_process').exec;
var test = require('tap').test;

var cmdln = require('../lib/cmdln');

// ---- globals and constants

var DEBUG = false;
var debug;
if (DEBUG) {
    debug = console.warn;
} else {
    debug = function _internalDebug() {};
}

// ---- internal support stuff

function objCopy(obj, target) {
    if (!target) {
        target = {};
    }
    Object.keys(obj).forEach(function onKey(k) {
        target[k] = obj[k];
    });
    return target;
}

// ---- tests

test('exports', function _(t) {
    t.ok(cmdln.Cmdln, 'cmdln.Cmdln');
    t.ok(cmdln.CmdlnError, 'cmdln.CmdlnError');
    t.ok(cmdln.OptionError, 'cmdln.OptionError');
    t.ok(cmdln.UnknownCommandError, 'cmdln.UnknownCommandError');
    t.ok(cmdln.main, 'cmdln.main');
    t.end();
});

test('<error>.code', function _(t) {
    var cause = new Error('boom');
    t.equal(new cmdln.OptionError(cause).code, 'Option');
    t.equal(new cmdln.UnknownCommandError('foo').code, 'UnknownCommand');
    t.end();
});

var cases = [
    // help
    {
        cmd: 'conan.js',
        expect: {
            stdout: [
                /^Usage/m,
                /^What is best/m,
                /^Options/m,
                /-h, --help/,
                /^Commands/m,
                /crush/,
                /hear/
            ],
            code: 1
        }
    },
    {
        cmd: 'conan.js -h',
        expect: {
            stdout: [
                /^Usage/m,
                /^What is best/m,
                /^Options/m,
                /-h, --help/,
                /^Commands/m,
                /crush/,
                /smash/,
                /hear/
            ]
        }
    },
    {
        cmd: 'conan.js --help',
        expect: {
            stdout: [
                /^Usage/m,
                /^What is best/m,
                /^Options/m,
                /-h, --help/,
                /^Commands/m,
                /crush/,
                /smash/,
                /hear/
            ]
        }
    },
    {
        cmd: 'conan.js help',
        expect: {
            stdout: [
                /^Usage/m,
                /^What is best/m,
                /^Options/m,
                /-h, --help/,
                /^Commands/m,
                /crush/,
                /smash/,
                /hear/
            ]
        }
    },
    {
        cmd: 'conan.js ?',
        expect: {
            stdout: [
                /^Usage/m,
                /^What is best/m,
                /^Options/m,
                /-h, --help/,
                /^Commands/m,
                /crush/,
                /smash/,
                /hear/
            ]
        }
    },

    // Custom option and init to handle it.
    {
        cmd: 'conan.js --version',
        expect: {
            stdout: /^conan \d+/
        }
    },

    // subcmd
    {
        cmd: 'conan.js crush',
        expect: {stdout: /^No enemies/}
    },
    {
        cmd: 'conan.js crush Bob',
        expect: {stdout: /^Smite Bob with a sword!/}
    },
    {
        cmd: 'conan.js crush Bob -w',
        /* JSSTYLED */
        expect: {err: /do not have enough args for "-w"/}
    },
    {
        cmd: 'conan.js crush Bob -w maul',
        expect: {stdout: /^Smite Bob with a maul!/}
    },
    {
        cmd: 'conan.js crush --weapon=spear Sally',
        expect: {stdout: /^Smite Sally with a spear!/}
    },
    {
        cmd: 'conan.js crush --weapon spear Sally',
        expect: {stdout: /^Smite Sally with a spear!/}
    },

    // alias
    {
        cmd: 'conan.js smash Bob',
        expect: {stdout: /^Smite Bob with a sword!/}
    },

    // hidden alias
    {
        cmd: 'conan.js pulverize Bob',
        expect: {stdout: /^Smite Bob with a sword!/}
    },

    // subcmd help
    {
        cmd: 'conan.js help crush',
        expect: {
            stdout: [
                /^Crush your enemies/,
                /^Usage/m,
                /conan crush/,
                /-w WEAPON, --weapon=WEAPON/,
                /^Options:/m
            ]
        }
    },
    {
        cmd: 'conan.js crush -h',
        expect: {
            stdout: [
                /^Crush your enemies/,
                /^Usage/m,
                /conan crush/,
                /-w WEAPON, --weapon=WEAPON/,
                /^Options:/m
            ]
        }
    },
    {
        cmd: 'conan.js crush --help',
        expect: {
            stdout: [
                /^Crush your enemies/,
                /^Usage/m,
                /conan crush/,
                /-w WEAPON, --weapon=WEAPON/,
                /^Options:/m
            ]
        }
    },

    // subcmd option processing, no options
    {
        cmd: 'conan.js see -h',
        expect: {
            stderr: /unknown option: "-h"/,
            code: 1
        }
    },
    {
        cmd: 'conan.js see -- -h',
        expect: {
            stdout: /I see -h./
        }
    },

    // global opts on `this.opts`
    {
        cmd: 'conan.js crush Bob',
        expect: {
            stdout: /Smite Bob with a sword!/
        }
    },
    {
        cmd: 'conan.js -x crush Bob',
        expect: {
            stdout: /Smite Bob with a sword! Yarg!/
        }
    },
    {
        cmd: 'conan.js see Bob',
        expect: {
            stdout: /I see Bob./
        }
    },
    {
        cmd: 'conan.js -x see Bob',
        expect: {
            stdout: /I see Bob. Yarg!/
        }
    },

    // `cmdln.main() options
    {
        cmd: 'main-opts.js',
        expect: {
            code: 1,
            stdout: /main-opts help/,
            stderr: /^$/
        }
    },
    {
        cmd: 'main-opts.js',
        env: {
            MAIN_OPTS_SHOW_NO_COMMAND_ERR: '1'
        },
        expect: {
            code: 1,
            stderr: /main-opts: error: no command given/
        }
    },
    {
        cmd: 'main-opts.js',
        env: {
            MAIN_OPTS_SHOW_NO_COMMAND_ERR: '1',
            MAIN_OPTS_SHOW_CODE: '1'
        },
        expect: {
            code: 1,
            stderr: /main-opts: error \(NoCommand\): no command given/
        }
    },
    {
        cmd: 'main-opts.js',
        env: {
            MAIN_OPTS_SHOW_NO_COMMAND_ERR: '1',
            MAIN_OPTS_SHOW_CODE: '1',
            MAIN_OPTS_SHOW_ERR_STACK: '1'
        },
        expect: {
            code: 1,
            stderr: [
                /main-opts: error \(NoCommand\): NoCommandError: no command given/,
                /cmdln\.js:/
            ]
        }
    },
    {
        cmd: 'main-opts.js --verbose',
        env: {
            MAIN_OPTS_SHOW_NO_COMMAND_ERR: '1',
            MAIN_OPTS_SHOW_CODE: '1'
        },
        expect: {
            code: 1,
            stderr: [
                /main-opts: error \(NoCommand\): NoCommandError: no command given/,
                /cmdln\.js:/
            ]
        }
    },
    {
        cmd: 'main-opts.js',
        env: {
            MAIN_OPTS_SHOW_NO_COMMAND_ERR: '1',
            MAIN_OPTS_SHOW_CODE: '1',
            MAIN_OPTS_ARGV: 'node,main-opts.js,--verbose'
        },
        expect: {
            code: 1,
            stderr: [
                /main-opts: error \(NoCommand\): NoCommandError: no command given/,
                /cmdln\.js:/
            ]
        }
    },

    // Test bwcompat support for v1 `cmdln.main()`.
    {
        cmd: 'bwcompat-main-v1.js',
        expect: {
            code: 1,
            stdout: /bwcompat-main-v1 help/,
            stderr: /bwcompat-main-v1: error: no command given/
        }
    },
    {
        cmd: 'bwcompat-main-v1.js',
        env: {
            DEBUG: '1'
        },
        expect: {
            code: 1,
            stderr: [
                /bwcompat-main-v1: error: NoCommandError: no command given/,
                /cmdln\.js:/
            ]
        }
    },
    {
        cmd: 'bwcompat-main-v1.js',
        env: {
            BWCOMPAT_MAIN_V1_SHOW_CODE: '1'
        },
        expect: {
            code: 1,
            stderr: [/bwcompat-main-v1: error \(NoCommand\): no command given/]
        }
    },
    {
        cmd: 'bwcompat-main-v1.js',
        env: {
            BWCOMPAT_MAIN_V1_ARGV: ',,--asdf'
        },
        expect: {
            code: 1,
            stderr: [/bwcompat-main-v1: error: unknown option: "--asdf"/]
        }
    },

    // Test .init() and .fini()
    {
        cmd: 'init-fini.js',
        expect: {
            code: 1,
            stdout: [/ran init/, /ran fini: undefined/]
        }
    },
    {
        cmd: 'init-fini.js hi',
        expect: {
            stdout: 'ran init\nhi\nran fini: hi'
        }
    },

    // Test sub-sub-commands.
    {
        cmd: 'subsubcmd.js',
        expect: {
            code: 1,
            stdout: [/^\s+blah\s+blah help/m, /^\s+sub\s+sub desc/m]
        }
    },
    {
        cmd: 'subsubcmd.js help',
        expect: {
            code: 0,
            stdout: [/^\s+blah\s+blah help/m, /^\s+sub\s+sub desc/m]
        }
    },
    {
        cmd: 'subsubcmd.js help sub',
        expect: {
            stdout: [/^sub desc/, /^\s+bleep\s+sub bleep help/m],
            notStdout: [/^\s+bloop/m]
        }
    },
    {
        cmd: 'subsubcmd.js sub help',
        expect: {
            stdout: [/^sub desc/, /^\s+bleep\s+sub bleep help/m],
            notStdout: [/^\s+bloop/m]
        }
    },
    {
        cmd: 'subsubcmd.js sub help bloop',
        expect: {
            stdout: /^sub bloop help/
        }
    },
    {
        cmd: 'subsubcmd.js help sub bloop',
        expect: {
            stdout: /^sub bloop help/
        }
    },
    {
        cmd: 'subsubcmd.js sub help bleep',
        expect: {
            stdout: /^sub bleep help/
        }
    },
    {
        cmd: 'subsubcmd.js blah',
        expect: {
            stdout: /^top blah: args=\[\]\s+$/
        }
    },
    {
        cmd: 'subsubcmd.js blah one two',
        expect: {
            stdout: /^top blah: args=\["one","two"\]\s+$/
        }
    },
    {
        cmd: 'subsubcmd.js sub',
        expect: {
            stdout: /^top sub: top.opts.verbose=false sub.opts.s=false\s+$/
        }
    },
    {
        cmd: 'subsubcmd.js sub -s',
        expect: {
            stdout: /^top sub: top.opts.verbose=false sub.opts.s=true\s+$/
        }
    },
    {
        cmd: 'subsubcmd.js -v sub bleep -s',
        expect: {
            code: 1,
            stderr: /^top sub bleep: error: unknown option: "-s"\s+/
        }
    },
    {
        cmd: 'subsubcmd.js -v sub -s bleep -t one two three',
        expect: {
            stdout: /^top sub bleep: top.opts.verbose=true sub.opts.s=true opts.t=one args=\["two","three"\]\s+$/
        }
    },

    // Test helpSubcmds.
    {
        cmd: 'help-subcmds.js help',
        expect: {
            stdout: [
                /Commands:\n {4}help/,
                /\n\n {4}in-empty-group/,
                /\n\n {2}Most Excellent Commands:\n {4}awesome/,
                /\n\n {2}Other Commands:\n {4}something-else/
            ]
        }
    },

    // Test {{cmd}} help template var.
    {
        cmd: 'cmd-template-var.js',
        expect: {
            code: 1,
            stdout: [
                /^\s+awesome\s+Usage: cmd-template-var awesome .../m,
                /^\s+lame\s+Usage: cmd-template-var lame .../m
            ]
        }
    },
    {
        cmd: 'cmd-template-var.js help',
        expect: {
            code: 0,
            stdout: [
                /^\s+awesome\s+Usage: cmd-template-var awesome .../m,
                /^\s+lame\s+Usage: cmd-template-var lame .../m
            ]
        }
    },
    {
        cmd: 'cmd-template-var.js help awesome',
        expect: {
            code: 0,
            stdout: [/^Usage: cmd-template-var awesome .../m]
        }
    },

    // Test synopses and errHelp.
    {
        cmd: 'synopses-and-errhelp.js',
        expect: {
            code: 1,
            stdout: [/^Usage:/m, /^ {4}synopses-and-errhelp \[OPTIONS/m]
        }
    },
    {
        cmd: 'synopses-and-errhelp.js help abc',
        expect: {
            code: 0,
            stdout: [
                /^Usage:/m,
                /^ {4}synopses-and-errhelp abc \[OPTIONS\] arg1 arg2$/m,
                /^ {4}synopses-and-errhelp abc --list-foo$/m
            ]
        }
    },
    {
        cmd: 'synopses-and-errhelp.js abc --bogus # OptionError',
        expect: {
            code: 1,
            stderr: [
                /* BEGIN JSSTYLED */
                /^synopses-and-errhelp abc: error: unknown option: "--bogus"$/m,
                /^usage: synopses-and-errhelp abc \[ --help \| -h \] \[ --file=FILE \| -f FILE \]$/m,
                /^ {4}\[ --list-foo \] \.\.\.$/m
                /* END JSSTYLED */
            ]
        }
    },
    {
        cmd: 'synopses-and-errhelp.js abc # UsageError',
        expect: {
            code: 1,
            stderr: [
                /* BEGIN JSSTYLED */
                /^synopses-and-errhelp abc: error: incorrect number of args$/m,
                /^usage:/m,
                /^ {4}synopses-and-errhelp abc \[OPTIONS\] arg1 arg2$/m,
                /^ {4}synopses-and-errhelp abc --list-foo$/m
                /* END JSSTYLED */
            ]
        }
    },
    {
        cmd: 'synopses-and-errhelp.js abd # UnknownCommandError',
        expect: {
            code: 1,
            stderr: [
                /* BEGIN JSSTYLED */
                /* END JSSTYLED */
                /^synopses-and-errhelp: error: unknown command: "abd"$/m,
                /^Did you mean this?/m,
                /^ {4}abc$/m
            ]
        }
    },

    // finale
    {
        cmd: 'needs-hard-exit.js -h  # finale=exit',
        expect: {
            code: 0
        }
    },

    // Test not swallowing programmer errors in handlers.
    {
        cmd: 'programmer-error.js hi',
        expect: {
            code: 1,
            stderr: [
                // Expect a traceback:
                //    /Users/trentm/tm/node-cmdln/node_modules/assert-plus/assert.js:22
                //        throw new assert.AssertionError({
                //        ^
                //
                //    AssertionError [ERR_ASSERTION]: cb (func) is required
                //        at new AssertionError (internal/assert.js:269:11)
                //        at _toss (/Users/trentm/tm/node-cmdln/node_modules/assert-plus/assert.js:22:11)
                //    ...
                /^.*node_modules\/assert-plus\/assert.js:\d+$/m,
                /^ {4}throw new assert.AssertionError\({$/m,
                /^ {4}\^$/m,
                /^AssertionError.*: cb \(func\) is required$/m,
                /^ {4}at someHelperFunction \(.*\/programmer-error.js:14:12\).*$/m
            ]
        }
    }
];

cases.forEach(function onCase(c, i) {
    var expect = c.expect;
    var cmd = c.cmd;
    var env = c.env;
    var envStr = '';
    if (env) {
        Object.keys(env).forEach(function onEnvvar(e) {
            envStr += format('%s=%s ', e, env[e]);
        });
    }
    var name = format('case %d: %s%s', i, envStr, c.cmd);

    if (
        process.env.TEST_CASE_FILTER &&
        name.indexOf(process.env.TEST_CASE_FILTER) === -1
    ) {
        debug(
            'skip test "%s": does not match TEST_CASE_FILTER "%s"',
            name,
            process.env.TEST_CASE_FILTER
        );
        return;
    }

    test(name, function _(t) {
        debug('--');
        var opts = {
            cwd: path.resolve(__dirname, '..')
        };
        var realCmd = cmd
            .replace(/^conan\.js/, 'node examples/conan.js')
            .replace(/^([\w-]+)\.js/, 'node test/cmd/$1.js');
        debug('cmd:', realCmd);
        if (env) {
            debug('env: %j', env);
            opts.env = objCopy(process.env, objCopy(env));
        }
        exec(realCmd, opts, function onExec(err, stdout, stderr) {
            var pats;

            debug('err:', err);
            debug('code:', err && err.code);
            debug('stdout: "%s"', stdout);
            debug('stderr: "%s"', stderr);

            if (expect.err) {
                t.ok(err, 'err');
                if (expect.err instanceof RegExp) {
                    t.match(
                        err.message,
                        expect.err,
                        'err.message should match ' + expect.err
                    );
                }
            }
            if (expect.code !== undefined) {
                var code = err ? err.code : 0;
                t.equal(
                    code,
                    expect.code,
                    format('exit code does not match %s: %s', expect.code, code)
                );
            }
            if (!(expect.err || expect.code !== undefined)) {
                t.ifError(err);
            }
            if (expect.stdout) {
                pats = Array.isArray(expect.stdout)
                    ? expect.stdout
                    : [expect.stdout];
                pats.forEach(function onPat(pat) {
                    if (typeof pat === 'string') {
                        pat = new RegExp(pat);
                    }
                    t.match(stdout, pat, 'stdout should match ' + pat);
                });
            }
            if (expect.notStdout) {
                pats = Array.isArray(expect.notStdout)
                    ? expect.notStdout
                    : [expect.notStdout];
                pats.forEach(function onPat(pat) {
                    if (typeof pat === 'string') {
                        pat = new RegExp(pat);
                    }
                    t.notMatch(stdout, pat, 'stdout should not match ' + pat);
                });
            }
            if (expect.stderr) {
                pats = Array.isArray(expect.stderr)
                    ? expect.stderr
                    : [expect.stderr];
                pats.forEach(function onPat(pat) {
                    if (typeof pat === 'string') {
                        pat = new RegExp(pat);
                    }
                    t.match(stderr, pat, 'stderr should match ' + pat);
                });
            }
            t.done();
        });
    });
});
