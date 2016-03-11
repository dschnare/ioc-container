/*global Package*/
Package.describe({
  name: 'dschnare:ioc-container',
  version: '2.0.1',
  // Brief, one-line summary of the package.
  summary: 'A simple IOC container',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/dschnare/meteor-ioc-container',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.1');
  api.use('ecmascript');
  api.addFiles([
    'lib/polyfills/Array.some.js',
    'lib/polyfills/Array.indexOf.js'
  ], 'client');
  api.addFiles([
    'lib/variadicNew.js',
    'lib/createMap.js',
    'lib/createServiceEntry.js',
    'lib/createIocContainer.js'
  ]);
  api.export('createIocContainer');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.addFiles([
    'lib/variadicNew.js',
    'lib/variadicNew.spec.js',
    'lib/createMap.js',
    'lib/createMap.spec.js',
    'lib/createServiceEntry.js',
    'lib/createServiceEntry.spec.js',
    'lib/createIocContainer.js',
    'lib/createIocContainer.spec.js'
  ]);
});
