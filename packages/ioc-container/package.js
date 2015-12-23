/*global Package*/
Package.describe({
  name: 'dschnare:ioc-container',
  version: '0.0.5',
  // Brief, one-line summary of the package.
  summary: 'A simple IOC container for Meteor',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/dschnare/meteor-ioc-container',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.1');
  api.use('ecmascript');
  api.addFiles('polyfills.js', 'client');
  api.addFiles([
    // Core
    'variadicNew.js',
    'ioc-container.js'
  ]);
  api.export('IocContainer');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('dschnare:ioc-container');
  api.addFiles('ioc-container-tests.js');
});
