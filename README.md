# steal-serviceworker

[![Join the chat at https://gitter.im/canjs/canjs](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/stealjs/steal?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/stealjs/steal-serviceworker/blob/master/LICENSE.md)
[![npm version](https://badge.fury.io/js/steal-serviceworker.svg)](https://badge.fury.io/js/steal-serviceworker)
[![Coverage Status](https://coveralls.io/repos/github/stealjs/steal-serviceworker/badge.svg?branch=master)](https://coveralls.io/github/stealjs/steal-serviceworker?branch=master)
[![Travis build status](https://travis-ci.org/stealjs/steal-serviceworker.svg?branch=master)](https://travis-ci.org/stealjs/steal-serviceworker)
[![Greenkeeper badge](https://badges.greenkeeper.io/stealjs/steal-serviceworker.svg)](https://greenkeeper.io/)

`steal-serviceworker` helps you to create a service worker for your app that’s built with [steal-tools](https://stealjs.com/docs/steal-tools.html).

## Usage

```js
const stealTools = require("steal-tools");
const precache = require("steal-serviceworker");


stealTools.build({
    config: __dirname + "/basics/package.json!npm"
}).then(function(buildResult){
    
   precache(buildResult, {});
   
});
```

## API

### precache(bundleResult, [options]) => [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)

`precache` does two things for you:
- Generates a service worker that contains all the files that steal-tools bundles into the [dest folder](https://stealjs.com/docs/steal-tools.build.html#dest)
- Creates a basic [service worker registration](templates/service-worker-registration.tmpl). `precache` can put this code into its own file or prepend the code into `steal.production.js` for you.

#### buildResult

The [BuildResult](https://stealjs.com/docs/steal-tools.BuildResult.html) obtained from calling [stealTools.build](https://stealjs.com/docs/steal-tools.build.html).

#### options

An optional object for specifying additional options. They are:

##### `bundleRegistration` [boolean]
Write the [service worker registration](templates/service-worker-registration.tmpl) template into `steal.production.js` or not.
If `false` the registration code gets written into a file named `service-worker-registration.js` into the [dest folder](https://stealjs.com/docs/steal-tools.build.html#dest)

Default: `false`

##### `cacheRegistration` [boolean]
Defines if the  [service worker registration](templates/service-worker-registration.tmpl) code is cached by the service worker as well.
This option only make sense if `bundleRegistration` is `false`.

##### `filename` [string]
The name of the service worker file.

Default: `service-worker.js`

##### `registrationTemplate` [string]
You can use your own registration for the service worker. 
E.g. you can handle the `state` of the service worker and can implement your own custom behaviors if the content of the cache changed.

Default: `path.join(__dirname, "service-worker-registration.tmpl")`

##### options parameter provided by [Google’s sw-precache](https://github.com/GoogleChrome/sw-precache)
```js
precache(buildResult, {
    staticFileGlobs: [
        
    ] 
});
```

## Changelog

See the [latest releases on GitHub](https://github.com/stealjs/steal-serviceworker/releases).

## License

[MIT](https://github.com/stealjs/steal-serviceworker/blob/master/LICENSE.md)
