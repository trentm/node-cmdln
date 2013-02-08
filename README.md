`node-cmdln` is a node.js helper lib for creating CLI tools with subcommands
(think `git`, `svn`, `zfs`, `brew`, etc.). It is a sister of my earlier
[Python lib for this](https://github.com/trentm/cmdln).

Follow <a href="https://twitter.com/intent/user?screen_name=trentmick" target="_blank">@trentmick</a>
for updates to node-cmdln.


# Usage

"conan.js":

    #!/usr/bin/env node
    var util = require('util');
    var cmdln = require('cmdln');

    function Conan() {
        this.name = 'foo';
    }
    util.inherits(Conan, cmdln.Cmdln);

    Conan.prototype.do_hello = function do_hello(self, subcmd, opts):
        """${cmd_name}: Conan greets thee"""
        print "Ugh!"





    XXX
