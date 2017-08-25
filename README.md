# steal-serviceworker

[![Greenkeeper badge](https://badges.greenkeeper.io/stealjs/steal-serviceworker.svg)](https://greenkeeper.io/)

[![Build Status](https://travis-ci.org/stealjs/steal-serviceworker.svg?branch=master)](https://travis-ci.org/stealjs/steal-serviceworker)

steal-serviceworker helps you to create a service worker for your app that's build with steal-tools

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
- it generates a service worker that contains all the files that steal-tools bundles into the [dest folder](https://stealjs.com/docs/steal-tools.build.html#dest)
- it creates a basic [service worker registration](src/service-worker-registration.tmpl). `precache` can put this code into its own file or prepend the code into `steal.production.js` for you.

#### buildResult

The [BuildResult](http://stealjs.com/docs/steal-tools.BuildResult.html) obtained from calling `stealTools.build`.

#### options

An optional object for specifying additional options. They are:

##### `bundleRegistration` [boolean]
Write the [service worker registration](src/service-worker-registration.tmpl) code into `steal.production.js` or not.
If `false` the registration code gets written into a file named `service-worker-registration.js` into the [dest folder](https://stealjs.com/docs/steal-tools.build.html#dest)

Default: `false`

##### `cacheRegistration` [boolean]
Defines if the  [service worker registration](src/service-worker-registration.tmpl) code is cached by the service worker as well.
This option only make sens if `bundleRegistration` is `false`.

##### `filename` [string]
The name of the service worker file.

Default: `service-worker.js`

##### `registrationTemplate` [string]
You can use your own registration for the service worker. 
E.g. you can handle the `state` of the service worker and can implement your own custom behaviors if the content of the cache changed.

Default: `path.join(__dirname, "service-worker-registration.tmpl")`

##### options parameter provided by googles [swPreache](https://github.com/GoogleChrome/sw-precache)
```js
precache(buildResult, {
    staticFileGlobs: [
        
    ] 
});
```


## License

MIT