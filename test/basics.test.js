/*
 * Copyright (c) 2014 Trent Mick. All rights reserved.
 *
 * node-cmdln tests
 */

var DEBUG = false;
if (DEBUG) {
    var debug = console.warn;
} else {
    var debug = function () {};
}

var path = require('path');
var format = require('util').format;
var exec = require('child_process').exec;


// node-tap API
if (require.cache[__dirname + '/tap4nodeunit.js'])
    delete require.cache[__dirname + '/tap4nodeunit.js'];
var tap4nodeunit = require('./tap4nodeunit.js');
var after = tap4nodeunit.after;
var before = tap4nodeunit.before;
var test = tap4nodeunit.test;

var cmdln = require('../lib/cmdln');


// ---- internal support stuff

function objCopy(obj, target) {
    if (!target) {
        target = {};
    }
    Object.keys(obj).forEach(function (k) {
        target[k] = obj[k];
    });
    return target;
}


// ---- tests

before(function (next) {
    next();
});

test('exports', function (t) {
    t.ok(cmdln.Cmdln, 'cmdln.Cmdln');
    t.ok(cmdln.CmdlnError, 'cmdln.CmdlnError');
    t.ok(cmdln.OptionError, 'cmdln.OptionError');
    t.ok(cmdln.UnknownCommandError, 'cmdln.UnknownCommandError');
    t.ok(cmdln.main, 'cmdln.main');
    t.end();
});

test('<error>.code', function (t) {
    var cause = new Error('boom')
    t.equal((new cmdln.OptionError(cause)).code, 'Option');
    t.equal((new cmdln.UnknownCommandError('foo')).code, 'UnknownCommand');
    t.end();
});

var cases = [
    // help
    {
        cmd: 'conan.js',
        expect: {
            stdout: [/^Usage/m, /^What is best/m, /^Options/m, /-h, --help/,
                /^Commands/m, /crush/, /hear/],
            code: 1
        }
    },
    {
        cmd: 'conan.js -h',
        expect: {
            stdout: [/^Usage/m, /^What is best/m, /^Options/m, /-h, --help/,
                /^Commands/m, /crush/, /hear/]
        }
    },
    {
        cmd: 'conan.js --help',
        expect: {
            stdout: [/^Usage/m, /^What is best/m, /^Options/m, /-h, --help/,
                /^Commands/m, /crush/, /hear/]
        }
    },
    {
        cmd: 'conan.js help',
        expect: {
            stdout: [/^Usage/m, /^What is best/m, /^Options/m, /-h, --help/,
                /^Commands/m, /crush/, /hear/]
        }
    },
    {
        cmd: 'conan.js ?',
        expect: {
            stdout: [/^Usage/m, /^What is best/m, /^Options/m, /-h, --help/,
                /^Commands/m, /crush/, /hear/]
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
        expect: { stdout: /^No enemies/ }
    },
    {
        cmd: 'conan.js crush Bob',
        expect: { stdout: /^Smite Bob with a sword!/ }
    },
    {
        cmd: 'conan.js crush Bob -w',
        expect: { err: /do not have enough args for "-w"/ }
    },
    {
        cmd: 'conan.js crush Bob -w maul',
        expect: { stdout: /^Smite Bob with a maul!/ }
    },
    {
        cmd: 'conan.js crush --weapon=spear Sally',
        expect: { stdout: /^Smite Sally with a spear!/ }
    },
    {
        cmd: 'conan.js crush --weapon spear Sally',
        expect: { stdout: /^Smite Sally with a spear!/ }
    },

    // subcmd help
    {
        cmd: 'conan.js help crush',
        expect: {
            stdout: [/^Crush your enemies/, /^Usage/m, /conan crush/,
                /-w WEAPON, --weapon=WEAPON/, /^Options:/m]
        }
    },
    {
        cmd: 'conan.js crush -h',
        expect: {
            stdout: [/^Crush your enemies/, /^Usage/m, /conan crush/,
                /-w WEAPON, --weapon=WEAPON/, /^Options:/m]
        }
    },
    {
        cmd: 'conan.js crush --help',
        expect: {
            stdout: [/^Crush your enemies/, /^Usage/m, /conan crush/,
                /-w WEAPON, --weapon=WEAPON/, /^Options:/m]
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
            MAIN_OPTS_SHOW_CODE: '1',
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
            stderr: [
                /bwcompat-main-v1: error \(NoCommand\): no command given/
            ]
        }
    },
    {
        cmd: 'bwcompat-main-v1.js',
        env: {
            BWCOMPAT_MAIN_V1_ARGV: ',,--asdf'
        },
        expect: {
            code: 1,
            stderr: [
                /bwcompat-main-v1: error: unknown option: "--asdf"/
            ]
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
            stdout: [
                /^\s+blah\s+blah help/m,
                /^\s+sub\s+sub desc/m
            ]
        }
    },
    {
        cmd: 'subsubcmd.js help',
        expect: {
            code: 0,
            stdout: [
                /^\s+blah\s+blah help/m,
                /^\s+sub\s+sub desc/m
            ]
        }
    },
    {
        cmd: 'subsubcmd.js help sub',
        expect: {
            stdout: [
                /^sub desc/,
                /^\s+bleep\s+sub bleep help/m
            ],
            notStdout: [
                /^\s+bloop/m
            ]
        }
    },
    {
        cmd: 'subsubcmd.js sub help',
        expect: {
            stdout: [
                /^sub desc/,
                /^\s+bleep\s+sub bleep help/m
            ],
            notStdout: [
                /^\s+bloop/m
            ]
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
            stdout: /^top blah: args=\s+$/
        }
    },
    {
        cmd: 'subsubcmd.js blah one two',
        expect: {
            stdout: /^top blah: args=one,two\s+$/
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
            stderr: /^top sub: error: unknown option: "-s"\s+/
        }
    },
    {
        cmd: 'subsubcmd.js -v sub -s bleep -t one two three',
        expect: {
            stdout: /^top sub bleep: top.opts.verbose=true sub.opts.s=true opts.t=one args=two,three\s+$/
        }
    }
];

cases.forEach(function (c, i) {
    var expect = c.expect;
    var cmd = c.cmd;
    var env = c.env;
    var envStr = '';
    if (env) {
        Object.keys(env).forEach(function (e) {
            envStr += format('%s=%s ', e, env[e]);
        });
    }
    var name = format('case %d: %s%s', i, envStr, c.cmd);

    if (process.env.TEST_FILTER && name.indexOf(process.env.TEST_FILTER) === -1) {
        debug('skip test "%s": does not match TEST_FILTER "%s"',
            name, process.env.TEST_FILTER);
        return;
    }

    test(name, function (t) {
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
        exec(realCmd, opts, function (err, stdout, stderr) {
            debug('err:', err);
            debug('code:', err && err.code);
            debug('stdout: "%s"', stdout);
            debug('stderr: "%s"', stderr);
            if (expect.err) {
                t.ok(err, 'err');
                if (expect.err instanceof RegExp) {
                    t.ok(expect.err.test(err.message),
                        format('err.message does not match %s: "%s"',
                            expect.err, err.message));
                }
            }
            if (expect.code !== undefined) {
                var code = err ? err.code : 0;
                t.equal(code, expect.code, format(
                    'exit code does not match %s: %s', expect.code, code));
            }
            if (!(expect.err || expect.code !== undefined)) {
                t.ifError(err);
            }
            if (expect.stdout) {
                var pats = (Array.isArray(expect.stdout)
                    ? expect.stdout : [expect.stdout]);
                pats.forEach(function (pat) {
                    if (typeof(pat) === 'string') {
                        pat = new RegExp(pat);
                    }
                    t.ok(pat.test(stdout), format(
                        'stdout does not match %s: "%s"', pat, stdout));
                });
            }
            if (expect.notStdout) {
                var pats = (Array.isArray(expect.notStdout)
                    ? expect.notStdout : [expect.notStdout]);
                pats.forEach(function (pat) {
                    if (typeof(pat) === 'string') {
                        pat = new RegExp(pat);
                    }
                    t.ok(!pat.test(stdout), format('stdout matches %s: %s',
                        pat, stdout));
                });
            }
            if (expect.stderr) {
                var pats = (Array.isArray(expect.stderr)
                    ? expect.stderr : [expect.stderr]);
                pats.forEach(function (pat) {
                    if (typeof(pat) === 'string') {
                        pat = new RegExp(pat);
                    }
                    t.ok(pat.test(stderr), format('stderr does not match %s: %s',
                        pat, stderr));
                });
            }
            t.done();
        });
    });
});
