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
var dashdash = require('dashdash');
var sprintf = require('extsprintf').sprintf;



// ---- internal support stuff

function space(n) {
    var s = '';
    for (var i = 0; i < n; i++) {
        s += ' ';
    }
    return s;
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
 *   'Cmdln' (generic), 'IllegalOption', etc.
 * - `cause` {Error} Optional. An underlying cause error.
 */
function CmdlnError(options) {
    assert.object(options, 'options');
    assert.string(options.message, 'options.message');
    assert.optionalString(options.code, 'options.code');
    if (!options.code) options.code = 'Cmdln';
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

function IllegalOptionError(cause, option) {
    if (option === undefined) {
        option = cause;
        cause = undefined;
    }
    assert.string(option);
    CmdlnError.call(this, {
        cause: cause,
        message: sprintf('illegal option: "%s"', option),
        code: 'IllegalOption',
        exitStatus: 1
    });
}
util.inherits(IllegalOptionError, CmdlnError);

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
 * @param config {Object} All keys are optional unless otherwise stated
 *      - @param name {String} Tool name. Defaults to lowercase'd constructor
 *        name.
 *      - @param desc {String} Description string to include at the top of
 *        usage information.
 *      - @param helpOpts {Object} Help output formatting options. These
 *        are the same formatting options as for `dashdash.Parser.help`:
 *        indent, maxCol, helpCol, minHelpCol, maxHelpCol (TODO:doc).
 *
 * XXX hooks for adding -h, --help, help ? instead of automatic?
 *      - @param helpOpt {Boolean} Whether to include the '-h|--help' option
 *        on the tool and subcommands. Default is true.
 *      - @param helpCmd {Boolean} Whether to include the `help` subcommand.
 *        Default true.
 *      - XXX take optional bunyan logger
 */
function Cmdln(config) {
    var self = this;
    assert.optionalObject(config, 'config');
    config = config || {};
    assert.optionalString(config.name, 'config.name')
    assert.optionalString(config.desc, 'config.desc')
    assert.optionalObject(config.helpOpts, 'config.helpOpts')

    this.name = config.name || this.constructor.name.toLowerCase();
    this.desc = config.desc;
    this.helpOpts = config.helpOpts || {};
    if (!this.helpOpts.indent)
        this.helpOpts.indent = space(4);
    else if (typeof(this.helpOpts.indent) === 'number')
        this.helpOpts.indent = space(this.helpOpts.indent);
    if (!this.helpOpts.maxCol) this.helpOpts.maxCol = 80;
    if (!this.helpOpts.minHelpCol) this.helpOpts.minHelpCol = 20;
    if (!this.helpOpts.maxHelpCol) this.helpOpts.maxHelpCol = 40;

    // XXX document and expose this.
    //* @param envopts {Array} Array or 2-tuples mapping envvar name to option for
    //*      which it is a fallback.
    //this.envopts = [];

    // Find the tree of constructors (typically just this and the Cmdln
    // super class) on who's prototype to look for "do_*" and "help_*"
    // methods.
    var prototypes = [];
    var ctor = this.constructor;
    while (ctor) {
        prototypes.push(ctor.prototype);
        ctor = ctor.super_; // presuming `util.inherits` usage
    }
    prototypes.reverse();

    // Load subcmds (do_* methods), aliases (`do_*.aliases`) and helpcmds
    // (`help_*` methods).
    this.subcmdOrder = [];
    this.subcmds = {};
    this.aliases = {};
    this.helpcmds = {};
    prototypes.forEach(function (proto) {
        Object.keys(proto)
            .filter(function (funcname) { return /^do_/.test(funcname); })
            //.sort()
            .forEach(function (funcname) {
                var name = funcname.slice(3);
                var func = proto[funcname];
                self.subcmds[name] = func;
                self.subcmdOrder.push(name);
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
    // p('subcmdOrder:', this.subcmdOrder);
    // p('subcmds: ', this.subcmds);
    // p('aliases: ', this.aliases);
    // p('helpcmds: ', this.helpcmds);
}


/**
 * Return the option parser for the tool.
 */
Cmdln.prototype.getOptParser = function getOptParser() {
    var options = [
        {
            names: ['help', 'h'],
            help: 'Show this help message and exit.',
            type: 'bool'
        }
    ];
    return new dashdash.Parser({options: options, interspersed: false});
};


/**
 * Cmdln mainline.
 *
 * @param argv {Array}
 * @param callback {Function} `function (err)`
 */
Cmdln.prototype.main = function main(argv, callback) {
    var self = this;
    try {
        this.optParser = this.getOptParser();
    } catch (e) {
        //XXX wrap error: WError usage
        callback(e);
    }
    self.handleArgv(argv, function (argvErr, opts, args) {
        if (argvErr) {
            callback(argvErr);
            return;
        }

        //XXX
        //// envopts
        //(self.envopts || []).forEach(function (envopt) {
        //    var envname = envopt[0];
        //    var optname = envopt[1];
        //    if (process.env[envname] && !opts[optname]) {
        //        //XXX trace log this
        //        // console.log('set `opts.%s = "%s" from %s envvar',
        //        //     optname, process.env[envname], envname);
        //        opts[optname] = process.env[envname];
        //    }
        //});

        if (args.length === 0) {
            self.printHelp(function (helpErr) { callback(helpErr); });
            return;
        } else if (opts.help) {
            // We want `cli foo -h` to show help for the 'foo' subcmd.
            if (args[0] !== 'help') {
                self.do_help(args[0], opts, args, callback);
                return;
            }
        }

        // XXX post argv/opt processing hook in which to setup. Perhaps
        //     something simple like `init()`.
        var subcmdArgv = argv.slice(0, 2).concat(args);
        var subcmd = args.shift();
        try {
            self.dispatch(subcmd, subcmdArgv,
                function (dispErr) { callback(dispErr); });
        } catch (ex) {
            callback(ex);
        }
    });
};


/**
 * Process command-line argv.
 *
 * @param argv {Array}
 * @param callback {Function} `function (err, opts, args)`.
 */
Cmdln.prototype.handleArgv = function handleArgv(argv, callback) {
    var opts = this.optParser.parse(argv);
    callback(null, opts, opts._args);
};


/**
 * Print top-level tool help.
 *
 * @param callback {Function} `function (err)`.
 */
Cmdln.prototype.printHelp = function printHelp(callback) {
    assert.func(callback, 'callback');
    var self = this;
    var helpOpts = this.helpOpts;
    var indent = helpOpts.indent;

    var lines = [];
    if (this.desc) {
        lines.push(this.desc);
        if (this.desc.slice(-1) !== '\n') {
            lines.push('');
        }
    }

    lines = lines.concat([
        'Usage:',
        format('%s%s [OPTIONS] COMMAND [ARGS...]', indent, self.name),
        format('%s%s help COMMAND', indent, self.name),
        ''
    ]);
    if (this.optParser.help) {
        lines.push('Options:');
        lines.push(this.optParser.help(helpOpts));
    }

    //XXX
    //if (self.envopts && self.envopts.length) {
    //    var envTemplate = indent + '%-23s  %s';
    //    lines.push('Environment:');
    //    self.envopts.forEach(function (envopt) {
    //        var envname = envopt[0];
    //        var optname = envopt[1];
    //        lines.push(sprintf(envTemplate, envname,
    //            'Fallback for --' + optname));
    //    });
    //    lines.push('');
    //}

    lines = lines.concat([
        'Commands:'
    ]);
    // Automatic command line from `this.subcmds`.
    // TODO: same helpCol as for the opts above, textwrap, etc.
    var cmdTemplate = format('%s%%-%ds  %s',
        indent, helpOpts.minHelpCol - indent.length - 2);
    this.subcmdOrder.forEach(function (name) {
        var func = self.subcmds[name];
        if (func.hidden) {
            return;
        }
        var names = name;
        if (func.aliases) {
            names += sprintf(' (%s)', func.aliases.join(', '));
        }
        var desc = (func.help || '').split('\n', 1)[0];
        desc = desc.replace(/{{name}}/g, self.name);
        var line = sprintf(cmdTemplate, names, desc);
        lines.push(line);
    });

    console.log(lines.join('\n'));
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

    //p("XXX dispatch", subcmd, argv, func.options)
    var opts = null;
    var args = argv.slice(3);
    if (func.options) {
        try {
            var parser = new dashdash.Parser({options: func.options});
        } catch (e) {
            //XXX Translate error
            callback(e);
        }
        try {
            opts = parser.parse(argv, 3);
        } catch (e) {
            //XXX Translate error: IllegalOptionError, etc.
            callback(e);
        }
        args = opts._args;
    }
    //p("XXX dispatch: opts=", opts, "args=", args)

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
    if (func.help) {
        var help = func.help;
        help = help.replace('{{name}}', name);
        if (~help.indexOf('{{options}}')) {
            var parser = new dashdash.Parser({options: func.options});
            help = help.replace('{{options}}',
                'Options:\n' + parser.help(this.helpOpts));
        }
        console.log(help.trimRight());
        callback();
    } else {
        callback(new CmdlnError({message: format('no help for "%s"', alias)}));
    }
};
Cmdln.prototype.do_help.aliases = ['?'];
Cmdln.prototype.do_help.help = 'Help on a specific sub-command.';

Cmdln.prototype.help_help = function help_help(subcmd, callback) {
    this.printHelp(callback);
};




// ---- exports

module.exports = {
    Cmdln: Cmdln,
    CmdlnError: CmdlnError,
    IllegalOptionError: IllegalOptionError,
    UnknownCommandError: UnknownCommandError
};
