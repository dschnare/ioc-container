/*global Package*/
Package.describe({
  name: 'dschnare:ioc-container',
  version: '3.0.0',
  // Brief, one-line summary of the package.
  summary: 'An IOC container',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/dschnare/ioc-container',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
})

Package.onUse(function (api) {
  api.versionsFrom('1.3')
  api.use('ecmascript')
  api.mainModule('src/IocContainer.js')
})
