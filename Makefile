#
# Copyright 2016 Trent Mick
# Copyright 2016 Joyent, Inc.
#

JSSTYLE_FILES := $(shell find lib -name "*.js")
NODEOPT ?= $(HOME)/opt
TAP_EXEC = ./node_modules/.bin/tap
TEST_JOBS ?= 10
TEST_TIMEOUT_S ?= 1200
TEST_FILTER ?= .*


all $(TAP_EXEC):
	npm install

.PHONY: distclean
distclean:
	rm -rf node_modules


.PHONY: ensure-node-v6-or-greater-for-test-suite
ensure-node-v6-or-greater-for-test-suite: | $(TAP_EXEC)
	@NODE_VER=$(shell node --version) && \
	    ./node_modules/.bin/semver -r '>=6.x' $$NODE_VER >/dev/null || \
	    (echo "error: node-tap@12 runner requires node v6 or greater: you have $$NODE_VER"; exit 1)

.PHONY: test
test: ensure-node-v6-or-greater-for-test-suite | $(TAP_EXEC)
	@testFiles="$(shell ls test/*.test.js | egrep "$(TEST_FILTER)")" && \
	    test -z "$$testFiles" || \
	    NODE_NDEBUG= $(TAP_EXEC) --timeout $(TEST_TIMEOUT_S) -j $(TEST_JOBS) -o ./test.tap $$testFiles

.PHONY: testall
testall: test6 test8 test10
.PHONY: test6
test6:
	@echo "# Test node 6.x (with node `$(NODEOPT)/node-6/bin/node --version`)"
	@$(NODEOPT)/node-6/bin/node --version
	@PATH="$(NODEOPT)/node-6/bin:$(PATH)" make test
.PHONY: test8
test8:
	@echo "# Test node 8.x (with node `$(NODEOPT)/node-8/bin/node --version`)"
	@$(NODEOPT)/node-8/bin/node --version
	@PATH="$(NODEOPT)/node-8/bin:$(PATH)" make test
.PHONY: test10
test10:
	@echo "# Test node 10.x (with node `$(NODEOPT)/node-10/bin/node --version`)"
	@$(NODEOPT)/node-10/bin/node --version
	@PATH="$(NODEOPT)/node-10/bin:$(PATH)" make test
.PHONY: test12
test12:
	@echo "# Test node 12.x (with node `$(NODEOPT)/node-12/bin/node --version`)"
	@$(NODEOPT)/node-12/bin/node --version
	@PATH="$(NODEOPT)/node-12/bin:$(PATH)" make test


.PHONY: check-jsstyle
check-jsstyle: $(JSSTYLE_FILES)
	./tools/jsstyle -o indent=4,doxygen,unparenthesized-return=0,blank-after-start-comment=0,leading-right-paren-ok $(JSSTYLE_FILES)

.PHONY: check
check:: check-jsstyle versioncheck
	@echo "Check ok."


# Ensure CHANGES.md and package.json have the same version.
.PHONY: versioncheck
versioncheck:
	@echo version is: $(shell cat package.json | json version)
	[[ `cat package.json | json version` == `grep '^## ' CHANGES.md | head -2 | tail -1 | awk '{print $$2}'` ]]

.PHONY: cutarelease
cutarelease: versioncheck
	[[ -z `git status --short` ]]  # If this fails, the working dir is dirty.
	@which json 2>/dev/null 1>/dev/null && \
	    ver=$(shell json -f package.json version) && \
	    name=$(shell json -f package.json name) && \
	    publishedVer=$(shell npm view -j $(shell json -f package.json name)@$(shell json -f package.json version) version 2>/dev/null) && \
	    if [[ -n "$$publishedVer" ]]; then \
		echo "error: $$name@$$ver is already published to npm"; \
		exit 1; \
	    fi && \
	    echo "** Are you sure you want to tag and publish $$name@$$ver to npm?" && \
	    echo "** Enter to continue, Ctrl+C to abort." && \
	    read
	ver=$(shell cat package.json | json version) && \
	    date=$(shell date -u "+%Y-%m-%d") && \
	    git tag -a "$$ver" -m "version $$ver ($$date)" && \
	    git push --tags origin && \
	    npm publish
