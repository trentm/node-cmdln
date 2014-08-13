#!/usr/bin/env node
/*
 * A CLI to show how one can do two-level deep subcommands, i.e. like
 * `git remote add ...`.
 */

var p = console.log;
var util = require('util');
var cmdln = require('../lib/cmdln'),
    Cmdln = cmdln.Cmdln;


//---- sub CLI for `git remote`

function GitRemote(parent) {
    this.parent = parent;
    Cmdln.call(this, {
        name: 'git remote',
        desc: 'manage set of tracked repositories',
        options: [
            {names: ['verbose', 'v'], type: 'bool', help: 'Verbose output.'},
        ],
        helpBody: (
            'More help content blah blah.'
        )
    });
}
util.inherits(GitRemote, Cmdln);

GitRemote.prototype.emptyLine = function (cb) {
    p('TODO: implement `git remote`');
};

GitRemote.prototype.do_add = function (subcmd, opts, args, cb) {
    p('TODO: implment `git remote add`: opts=%j args=%j', opts, args)
    cb();
};
GitRemote.prototype.do_add.options = [
    {
        names: ['t'],
        helpArg: '<branch>',
        type: 'string'
    }
];
GitRemote.prototype.do_add.help = (
    'Adds a remote named <name> for the repository ...\n'
    + '\n'
    + 'Usage:\n'
    + '     {{name}} add [<options>] <name> <url>\n'
    + '\n'
    + '{{options}}'
);

GitRemote.prototype.do_rename = function (subcmd, opts, args, cb) {
    p('TODO: implement `git remote rename`: opts=%j args=%j', opts, args);
    cb();
};
GitRemote.prototype.do_rename.help = (
    'Rename the remote named <old> to <new>.\n'
    + '\n'
    + 'Usage:\n'
    + '     {{name}} rename <old> <new>\n'
);


//---- sub CLI for `git submodule`

function GitSubmodule(parent) {
    this.parent = parent;
    Cmdln.call(this, {
        name: 'git submodule',
        desc: 'Initialize, update or inspect submodules',
        options: [
            {names: ['quiet'], type: 'bool'}
        ]
    });
}
util.inherits(GitSubmodule, Cmdln);

GitSubmodule.prototype.emptyLine = function (cb) {
    p('TODO: implement `git submodule`');
};

GitSubmodule.prototype.do_add = function (subcmd, opts, args, cb) {
    p('TODO: implment `git submodule add`: opts=%j args=%j', opts, args)
    cb();
};
GitSubmodule.prototype.do_add.options = [
    {
        names: ['b'],
        helpArg: '<branch>',
        type: 'string'
    }
];
GitSubmodule.prototype.do_add.help = (
    'Add the given repository as a submodule at the given ...\n'
    + '\n'
    + 'Usage:\n'
    + '     {{name}} add [<options>] [--] <repository> [<path>]\n'
    + '\n'
    + '{{options}}'
);

GitSubmodule.prototype.do_status = function (subcmd, opts, args, cb) {
    p('TODO: implement `git submodule status`: opts=%j args=%j', opts, args);
    cb();
};
GitSubmodule.prototype.do_status.help = (
    'Show the status of the submodules. This will...\n'
    + '\n'
    + 'Usage:\n'
    + '     {{name}} status [<options>] [--] [<path>...]\n'
);



//---- top-level CLI for `git`

function Git() {
    Cmdln.call(this, {
        name: 'git',
        desc: 'A faux-git skeleton to show how to do sub-subcommands like '
            + '`git remote ...` with node-cmdln.',
        options: [
            {names: ['help', 'h'], type: 'bool', help: 'Print help and exit.'},
            {names: ['version'], type: 'bool', help: 'Print version and exit.'}
        ]
    });
}
util.inherits(Git, Cmdln);

Git.prototype.init = function (opts, args, cb) {
    if (opts.version) {
        p('(pretend) Git version 1.0.0');
        return cb(false);
    }
    Cmdln.prototype.init.apply(this, arguments);
};


Git.prototype.do_config = function (subcmd, opts, args, cb) {
    p('git config: opts=%j args=%j', opts, args)
    cb();
};

Git.prototype.do_remote = GitRemote;
Git.prototype.do_submodule = GitSubmodule;



//---- mainline

if (require.main === module) {
    cmdln.main(new Git(), {showErrStack: true});
}
