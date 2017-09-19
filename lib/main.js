"use strict";

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

// const {promisify} = require('util');
// use native promisify if node 8 lands on steal-tools
const promisify = require("es6-promisify");

const path = require("path");
const fs = require("fs");
const UglifyJS = require("uglify-js");
const swPrecache = require("sw-precache");
const winston = require("winston");

const _template = require("lodash.template");

const fsReadFile = promisify(fs.readFile);
const fsWriteFile = promisify(fs.writeFile);
const fsUnlink = promisify(fs.unlink);

/**
 * Creates a service worker for you
 */
class ServiceWorker {
    constructor(buildResult, options = {}) {
        options = typeof options !== "object" ? {} : options;

        const templateDir = path.join(__dirname, "..", "templates");

        this._buildResult = buildResult;

        this.swFilename = options.filename || "service-worker.js";
        this.swTemplate = path.join(templateDir, "service-worker.tmpl");

        this.bundleRegistration = !(options.bundleRegistration != null);
        this.cacheRegistration = options.cacheRegistration;
        this.registrationTemplate = options.registrationTemplate || path.join(templateDir, "service-worker-registration.tmpl");

        delete options.filename;
        delete options.bundleRegistration;
        delete options.cacheRegistration;

        if (!buildResult || !buildResult.configuration || !buildResult.configuration.dest) {
            throw new Error('Provide a buildResult');
        }

        this.destFolder = buildResult.configuration.dest;
        this.baseUrl = buildResult.loader.baseURL.replace(/^file:/g, "");

        this.options = Object.assign({
            stripPrefix: this.baseUrl,
            templateFilePath: this.swTemplate
        }, options);

        if (!this.options.staticFileGlobs) {
            this.options.staticFileGlobs = [path.join(this.destFolder, '**', '*.*')];
        } else {
            let globs = [];
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = this.options.staticFileGlobs[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    let glob = _step.value;

                    // go though all the globs and add the baseUrl path to it
                    if (!path.isAbsolute(glob)) {
                        globs.push(path.join(this.baseUrl, glob));
                    } else {
                        globs.push(glob);
                    }
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            this.options.staticFileGlobs = globs;
        }

        // there is currently no way to exclude some files
        // https://github.com/GoogleChrome/sw-precache/issues/97
        // so we need a workaround
        // if(this.cacheRegistration === false) {
        //     this.options.staticFileGlobs.push(path.join(this.destFolder,"(!service-worker-registration.js)"))
        // }
    }

    /**
     * Create a service worker and a serive worker registration
     *
     * @returns {Promise.<void>}
     */
    create() {
        var _this = this;

        return _asyncToGenerator(function* () {
            // swap the creation of a service worker because currently we can not exclude
            // a file in staticFileGlobs
            if (_this.bundleRegistration === false && _this.cacheRegistration === false) {
                yield fsUnlink(path.join(_this.destFolder, "service-worker-registration.js"));
                yield _this._createServiceWorker();
                yield _this._createServiceWorkerRegistration();
            } else {
                yield _this._createServiceWorkerRegistration();
                yield _this._createServiceWorker();
            }
        })();
    }

    /**
     * Create the actual service worker file by googls sw-precache
     *
     * @returns {Promise.<*>}
     */
    _createServiceWorker() {
        var _this2 = this;

        return _asyncToGenerator(function* () {
            return swPrecache.write(path.join(_this2.destFolder, "..", _this2.swFilename), _this2.options);
        })();
    }

    /**
     * Compile the registration template with given variables
     *
     * @returns {Promise.<*>}
     */
    _compileSWRegistrationTemplate() {
        var _this3 = this;

        return _asyncToGenerator(function* () {
            let fileContent = yield fsReadFile(_this3.registrationTemplate, { encoding: "utf-8" });
            let compiled = _template(fileContent);
            return compiled({
                swFilename: _this3.swFilename
            });
        })();
    }

    /**
     * create a serice worker registration code and write it to a file
     *
     * @returns {Promise.<void>}
     */
    _createServiceWorkerRegistration() {
        var _this4 = this;

        return _asyncToGenerator(function* () {
            if (_this4.bundleRegistration) {
                if (_this4.buildResult.buildType === "optimize") {
                    // slim build
                    if (_this4.buildResult.options.splitLoader === true) {
                        // first object in the bundles array is the loader
                        let loader = _this4.buildResult.bundles[0];
                        yield _this4._writeIFFE2File(loader.bundlePath);
                    } else {
                        let mains = _this4._findMains();
                        yield _this4._writeIntoMains(mains);
                    }
                } else if (_this4.buildResult.buildType === "build") {
                    // multibuild
                    if (_this4.buildResult.options.bundleSteal === true) {
                        let mains = _this4._findMains();

                        yield _this4._writeIntoMains(mains);
                    } else {
                        const stealProd = path.join(_this4.destFolder, "steal.production.js");

                        yield _this4._writeIFFE2File(stealProd);
                    }
                } else {
                    throw new Error('steal-sericeworker only supports "build" and "optimize" build-types');
                }
            } else {
                // create a new file
                yield _this4._writeIFFE2File(path.join(_this4.destFolder, "service-worker-registration.js"));
            }
        })();
    }

    /**
     * Write the IFFE into main's
     *
     * @param mains
     * @returns {Promise.<void>}
     */
    _writeIntoMains(mains) {
        var _this5 = this;

        return _asyncToGenerator(function* () {
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = mains[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    let main = _step2.value;

                    yield _this5._writeIFFE2File(main);
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }
        })();
    }

    /**
     * Extract the mains out of the bundles array
     *
     * @returns {Array}
     * @private
     */
    _findMains() {
        let mains = [];

        // a array of mains
        let builtMains = this.buildResult.mains;

        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
            for (var _iterator3 = this.buildResult.bundles[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                let bundle = _step3.value;

                if (bundle.bundles.length === 1 && bundle.buildType === "js" && builtMains.indexOf(bundle.bundles[0]) > -1) {
                    mains.push(bundle.bundlePath);
                }
            }
        } catch (err) {
            _didIteratorError3 = true;
            _iteratorError3 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion3 && _iterator3.return) {
                    _iterator3.return();
                }
            } finally {
                if (_didIteratorError3) {
                    throw _iteratorError3;
                }
            }
        }

        return mains;
    }

    /**
     * Create an IFFE and prepend it to a given file
     *
     * @param file
     * @returns {Promise.<void>}
     * @private
     */
    _writeIFFE2File(file) {
        var _this6 = this;

        return _asyncToGenerator(function* () {
            let fileOnly = false;
            let swRegistrationCode = yield _this6._compileSWRegistrationTemplate();
            swRegistrationCode = UglifyJS.minify(swRegistrationCode);

            let code = yield fsReadFile(file, { encoding: "utf-8" }).catch(function (e) {
                fileOnly = true;
            });
            let iffe = `(function(){${swRegistrationCode.code}})();`;

            if (fileOnly === true || _this6.bundleRegistration === false) {
                yield fsWriteFile(file, iffe);
            } else {
                yield fsWriteFile(file, iffe + "\n\n" + code);
            }
        })();
    }

    /**
     * Getter
     *
     * @returns {*}
     */
    get buildResult() {
        return this._buildResult;
    }
}

module.exports = (() => {
    var _ref = _asyncToGenerator(function* (buildResult, options) {
        winston.info("Creating a service worker...");
        const serviceWorker = new ServiceWorker(buildResult, options);
        yield serviceWorker.create();
        return serviceWorker.buildResult;
    });

    return function (_x, _x2) {
        return _ref.apply(this, arguments);
    };
})();