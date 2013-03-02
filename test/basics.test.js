/*
 * Copyright (c) 2013 Trent Mick. All rights reserved.
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


// ---- tests

before(function (next) {
    next();
});

test('exports', function (t) {
    t.ok(cmdln.Cmdln, 'cmdln.Cmdln');
    t.ok(cmdln.CmdlnError, 'cmdln.CmdlnError');
    t.ok(cmdln.IllegalOptionError, 'cmdln.IllegalOptionError');
    t.ok(cmdln.UnknownCommandError, 'cmdln.UnknownCommandError');
    t.end();
});

test('<error>.code', function (t) {
    ['IllegalOption', 'UnknownCommand'].forEach(function (name) {
        var e = new cmdln[name + 'Error']('msg');
        t.equal(e.code, name);
    });
    t.end();
});

var cases = [
    // help
    {
        cmd: 'conan.js',
        expect: {
            stdout: [/^Usage/m, /^What is best/m, /^Options/m, /-h, --help/,
                /^Commands/m, /crush/, /hear/]
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


];

cases.forEach(function (c, i) {
    var expect = c.expect;
    var cmd = c.cmd;
    var name = format('case %d: %s', i, c.cmd);
    test(name, function (t) {
        debug('--');
        var opts = {
            cwd: path.resolve(__dirname, '..')
        };
        var realCmd = cmd.replace(/conan.js/, 'node examples/conan.js');
        exec(realCmd, opts, function (err, stdout, stderr) {
            debug('err:', err);
            debug('stdout: "%s"', stdout);
            debug('stderr: "%s"', stderr);
            if (expect.err) {
                t.ok(err, 'err');
                if (expect.err instanceof RegExp) {
                    t.ok(expect.err.test(err.message),
                        format('err.message does not match %s: "%s"',
                            expect.err, err.message));
                }
            } else {
                t.ifError(err);
            }
            if (expect.stdout) {
                var pats = (Array.isArray(expect.stdout)
                    ? expect.stdout : [expect.stdout]);
                pats.forEach(function (pat) {
                    if (typeof(pat) === 'string') {
                        pat = new RegExp(pat);
                    }
                    t.ok(pat.test(stdout), format('stdout does not match %s: %s',
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
