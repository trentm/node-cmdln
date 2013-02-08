/*
 * Copyright (c) 2013, Trent Mick. All rights reserved.
 * Copyright (c) 2013, Joyent, Inc. All rights reserved.
 */

var util = require('util'),
    format = util.format;
var p = console.warn;
var child_process = require('child_process'),
    spawn = child_process.spawn,
    exec = child_process.exec;
var os = require('os');
var path = require('path');
var fs = require('fs');

var assert = require('assert-plus');
var WError = require('verror').WError;
var nopt = require('nopt');
var sprintf = require('extsprintf').sprintf;



// ---- globals

var VERSION = require('../package.json').version;



// ---- internal support stuff

/**
 * Return an 80-column wrapped string.
 */
function textWrap(text) {
    var width = 80;
    var words = text.split(/\s+/g).reverse();
    var lines = [];
    var line = '';
    while (words.length) {
        var word = words.pop();
        if (line.length + 1 + word.length >= width) {
            lines.push(line);
            line = '';
        }
        if (line.length)
            line += ' ' + word;
        else
            line += word;
    }
    lines.push(line);
    return lines.join('\n');
}

function objCopy(obj) {
    var copy = {};
    Object.keys(obj).forEach(function (k) {
        copy[k] = obj[k];
    });
    return copy;
}


// ---- Errors

/**
 * Base CmdlnError. Instances (including derived errors) have these attributes:
 *
 * - `message` {String} All errors will have a message.
 * - `code` {String} A CamelCase code string for this type of error. E.g.
 *   'Cmdln' (generic), 'UnknownOption', etc.
 * - `cause` {Error} Optional. An underlying cause error.
 */
function CmdlnError(options) {
    assert.object(options, 'options');
    assert.string(options.message, 'options.message');
    if (!options.code) options.code = 'Cmdln';
    assert.optionalString(options.code, 'options.code');
    assert.optionalObject(options.cause, 'options.cause');
    var self = this;

    var args = [];
    if (options.cause) args.push(options.cause);
    args.push(options.message);
    WError.apply(this, args);

    var extra = Object.keys(options).filter(
        function (k) { return ['cause', 'message'].indexOf(k) === -1; });
    extra.forEach(function (k) {
        self[k] = options[k];
    });
}
util.inherits(CmdlnError, WError);

function UnknownOptionError(cause, option) {
    if (option === undefined) {
        option = cause;
        cause = undefined;
    }
    assert.string(option);
    CmdlnError.call(this, {
        cause: cause,
        message: sprintf('unknown option: "%s"', option),
        code: 'UnknownOption',
        exitStatus: 1
    });
}
util.inherits(UnknownOptionError, CmdlnError);

function UnknownCommandError(cause, command) {
    if (command === undefined) {
        command = cause;
        cause = undefined;
    }
    assert.string(command);
    CmdlnError.call(this, {
        cause: cause,
        message: sprintf('unknown command: "%s"', command),
        code: 'UnknownCommand',
        exitStatus: 1
    });
}
util.inherits(UnknownCommandError, CmdlnError);



// ---- Cmdln object

/**
 * Create a command line tool.
 *
 * @param options {Object} Optional
 *      - @param name {String} Tool name. Defaults to lowercase'd constructor
 *        name.
 */
function Cmdln(options) {
    var self = this;
    assert.optionalObject(options, 'options');
    this.name = (options && options.name) || this.name
        || this.constructor.name.toLowerCase();

    this.envopts = [];

    // Find the tree of constructors (typically just this and the Cmdln
    // super class) on who's prototype to look for "do_*" and "help_*"
    // methods.
    var prototypes = [this.constructor.prototype];
    var ctor = this.constructor;
    while (ctor) {
        prototypes.push(ctor.prototype);
        ctor = ctor.super_; // presuming `util.inherits` usage
    }
    prototypes.reverse();

    // Load subcmds (do_* methods), aliases (`do_*.aliases`) and helpcmds
    // (`help_*` methods).
    this.subcmds = {};
    this.aliases = {};
    this.helpcmds = {};
    prototypes.forEach(function (proto) {
        Object.keys(proto)
            .filter(function (funcname) { return /^do_/.test(funcname); })
            .sort()
            .forEach(function (funcname) {
                var name = funcname.slice(3);
                var func = proto[funcname];
                self.subcmds[name] = func;
                self.aliases[name] = name;
                (func.aliases || []).forEach(function (alias) {
                    self.aliases[alias] = name;
                });
            });
        Object.keys(proto)
            .filter(function (funcname) { return /^help_/.test(funcname); })
            .sort()
            .forEach(function (funcname) {
                var name = funcname.slice(5);
                var func = proto[funcname];
                self.helpcmds[name] = func;
            });
    });
    // p('subcmds: ', this.subcmds)
    // p('aliases: ', this.aliases)
    // p('helpcmds: ', this.helpcmds)
}


/**
 * Cmdln mainline.
 *
 * @param argv {Array}
 * @param callback {Function} `function (helpErr, verbose)`
 *      Where `verbose` is a boolean indicating if verbose output was
 *      requested by user options.
 */
Cmdln.prototype.main = function main(argv, callback) {
    var self = this;
    this.handleArgv(argv, this.envopts, function (argvErr, opts) {
        if (argvErr) {
            callback(argvErr);
            return;
        }

        var verbose = Boolean(opts.verbose);
        var args = opts.argv.remain;
        if (opts.version) {
            console.log(self.name + ' ' + VERSION);
            callback(null, verbose);
            return;
        }
        if (args.length === 0) {
            self.printHelp(function (helpErr) { callback(helpErr, verbose); });
            return;
        } else if (opts.help) {
            // We want `cli foo -h` to show help for the 'foo' subcmd.
            if (args[0] !== 'help') {
                self.do_help(args[0], opts, args, callback);
                return;
            }
        }

        // XXX ditch this 'verbose' automatic option

        // XXX post argv/opt processing hook in which to setup. Perhaps
        //     something simple like `init()`.
        var subcmd = args.shift();
        try {
            self.dispatch(subcmd, argv,
                function (dispErr) { callback(dispErr, verbose); });
        } catch (ex) {
            callback(ex, verbose);
        }
    });
};


/**
 * Process options.
 *
 * @param argv {Array}
 * @param envopts {Array} Array or 2-tuples mapping envvar name to option for
 *      which it is a fallback.
 * @param callback {Function} `function (err, opts)`.
 */
Cmdln.prototype.handleArgv = function handleArgv(argv, envopts, callback) {
    var longOpts = this.longOpts = {
        'help': Boolean,
        'version': Boolean,
        'verbose': [Boolean, Array]
    };
    var shortOpts = this.shortOpts = {
        'h': ['--help'],
        'v': ['--verbose']
    };

    var opts = nopt(longOpts, shortOpts, argv, 2);

    // envopts
    (envopts || []).forEach(function (envopt) {
        var envname = envopt[0];
        var optname = envopt[1];
        if (process.env[envname] && !opts[optname]) {
            // console.log('set `opts.%s = "%s" from %s envvar',
            //     optname, process.env[envname], envname);
            opts[optname] = process.env[envname];
        }
    });

    callback(null, opts);
};

Cmdln.prototype.printHelp = function printHelp(callback) {
    var self = this;

    var lines = [];
    if (this.description) {
        lines.push(this.description);
        if (this.description.slice(-1) !== '\n') {
            lines.push('');
        }
    }

    lines = lines.concat([
        'Usage:',
        '    %s [<options>] <command> [<args>...]',
        '    %s help <command>',
        '',
        'Options:',
        '    -h, --help          Show this help message and exit.',
        '    --version           Show version and exit.',
        '    -v, --verbose       Debug logging. Multiple times for more.'
    ]);

    if (self.envopts && self.envopts.length) {
        var envTemplate = '    %-23s  %s';
        lines.push('');
        lines.push('Environment:');
        self.envopts.forEach(function (envopt) {
            var envname = envopt[0];
            var optname = envopt[1];
            lines.push(sprintf(envTemplate, envname,
                'Fallback for --' + optname));
        });
    }

    lines = lines.concat([
        '',
        'Commands:'
    ]);
    // Automatic command line from `this.subcmds`.
    // TODO: provide override, or only do as part of templating
    var cmdTemplate = '    %-18s  %s';
    Object.keys(this.subcmds).forEach(function (name) {
        var func = self.subcmds[name];
        if (func.hidden) {
            return;
        }
        var names = name;
        if (func.aliases) {
            names += sprintf(' (%s)', func.aliases.join(', '));
        }
        var desc = (func.description ?
            func.description.split('\n', 1)[0] : '');
        desc = desc.replace(/\$NAME/g, self.name);
        var line = sprintf(cmdTemplate, names, desc);
        lines.push(line);
    });

    // XXX real template, hogan, say
    console.log(lines.join('\n').replace(/%s/g, this.name));
    callback();
};

/**
 * Dispatch to the appropriate "do_SUBCMD" function.
 */
Cmdln.prototype.dispatch = function dispatch(subcmd, argv, callback) {
    var name = this.aliases[subcmd];
    if (!name) {
        callback(new UnknownCommandError(subcmd));
        return;
    }
    var func = this.subcmds[name];

    // Reparse the whole argv with merge global and subcmd options. This
    // is the only way (at least with `nopt`) to correctly parse subcmd opts.
    // It has the bonus of allowing *boolean* subcmd options before the
    // subcmd name, if that is helpful. E.g.:
    //      `joyent-imgadm -u trentm -j images`
    var longOpts = objCopy(this.longOpts);
    if (func.longOpts) {
        Object.keys(func.longOpts).forEach(
            function (k) { longOpts[k] = func.longOpts[k]; });
    }
    var shortOpts = objCopy(this.shortOpts);
    if (func.shortOpts) {
        Object.keys(func.shortOpts).forEach(
            function (k) { shortOpts[k] = func.shortOpts[k]; });
    }
    var opts = nopt(longOpts, shortOpts, argv, 2);
    // p({opts: opts, argv: argv}, 'parsed subcmd argv');

    // Die on unknown opts.
    var extraOpts = objCopy(opts);
    delete extraOpts.argv;
    Object.keys(longOpts).forEach(function (o) { delete extraOpts[o]; });
    extraOpts = Object.keys(extraOpts);
    if (extraOpts.length) {
        callback(new UnknownOptionError(extraOpts.join(', ')));
        return;
    }

    var args = opts.argv.remain;
    delete opts.argv;
    assert.equal(subcmd, args.shift());
    func.call(this, subcmd, opts, args, callback);
};

Cmdln.prototype.do_help = function do_help(subcmd, opts, args, callback) {
    var self = this;
    if (args.length === 0) {
        this.printHelp(callback);
        return;
    }
    var alias = args[0];
    var name = this.aliases[alias];
    if (!name) {
        callback(new UnknownCommandError(alias));
        return;
    }

    // If there is a `.help_NAME`, use that.
    var helpfunc = this.helpcmds[name];
    if (helpfunc) {
        helpfunc.call(this, alias, callback);
        return;
    }

    var func = this.subcmds[name];
    if (func.description) {
        var desc = func.description.replace(/\$NAME/g, self.name).trimRight();
        console.log(desc);
        callback();
    } else {
        callback(new CmdlnError(format('no help for "%s"', alias)));
    }
};
Cmdln.prototype.do_help.aliases = ['?'];
Cmdln.prototype.do_help.description
    = 'Give detailed help on a specific sub-command.';

Cmdln.prototype.help_help = function help_help(subcmd, callback) {
    this.printHelp(callback);
};




// ---- exports

module.exports = {
    Cmdln: Cmdln,
    CmdlnError: CmdlnError,
    UnknownOptionError: UnknownOptionError,
    UnknownCommandError: UnknownCommandError
};
