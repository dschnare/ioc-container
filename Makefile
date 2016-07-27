.PHONY : default test publish set-version check-version clean

# Typical Uses
#
# Build for Nodejs
#   make
#
# Test
#   make test
#
# Bump Version
#   make set-version VERSION=3.0.0
#
# Publish to NPM and Atmosphere
#   make publish



# The directory we'll build files for NodeJS.
build_dir := commonjs
# Grab the current directory. It's expected that make will be run in the package root.
pwd := $(shell pwd)
# Read the current version of the package.
current_version := $(shell node -e 'console.log(require("./package.json").version)')



# Run the default targerts.
default : build meteor/packages/ioc-container/src

# Build the ES3 NodeJS files from the ES2015 source files.
build : src/*
	@npm run build

# Create the symbolic links for the meteor project.
meteor/packages/ioc-container/src :
	@ln -s $(pwd)/src/ meteor/packages/ioc-container/src
	@ln -s $(pwd)/README.md meteor/packages/ioc-container/README.md

# Run the tests in NodeJS.
test : build
	@npm test

# Publish the package on NPM and Atmosphere. This requires the package already exist on Atmosphere.
publish : default
	@npm publish --access public
	@pushd . && cd meteor/packages/ioc-container && meteor publish && popd

# Set the version number in package.json and package.js
# Requires VERSION be set on the command line.
set-version : check-version
	@sed -E -i '' 's/"version":[[:space:]]+"[^"]+"/"version": "$(VERSION)"/' package.json
	@sed -E -i '' "s/version:[[:space:]]+'[^']+'/version: '$(VERSION)'/" meteor/packages/ioc-container/package.js

# Ensure a VERSION is specified at the command line and that it is different than the current version.
check-version :
ifeq ($(VERSION),)
	$(error VERSION on command line not specified. Use VERSION=x.x.x on the command line.)
else ifeq ($(current_version), $(VERSION))
	$(error Version has not been updated since $(current_version).)
endif

# Clean all artifacts.
clean :
	@rm -fr $(build_dir)
	@rm -f meteor/packages/ioc-container/src