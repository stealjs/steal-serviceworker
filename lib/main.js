"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// const {promisify} = require('util');
// use native promisify if node 8 lands on steal-tools
var promisify = require("es6-promisify");

var path = require("path");
var fs = require("fs");
var UglifyJS = require("uglify-js");
var swPrecache = require("sw-precache");
var winston = require("winston");

var _template = require("lodash.template");

var fsReadFile = promisify(fs.readFile);
var fsWriteFile = promisify(fs.writeFile);
var fsUnlink = promisify(fs.unlink);

/**
 * Creates a service worker for you
 */

var ServiceWorker = function () {
    function ServiceWorker(buildResult) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        _classCallCheck(this, ServiceWorker);

        options = typeof options !== "object" ? {} : options;

        if (!buildResult || typeof buildResult !== "object") {
            throw new Error("no buildResult is provided");
        }
        if (buildResult.hasOwnProperty("web")) {
            buildResult = buildResult['web'];
        }
        if (!buildResult.configuration || !buildResult.configuration.dest) {
            throw new Error("malconfigured builtResult");
        }

        var templateDir = path.join(__dirname, "..", "templates");

        this._buildResult = buildResult;

        this.swFilename = options.filename || "service-worker.js";
        this.swTemplate = path.join(templateDir, "service-worker.tmpl");

        this.stealProductionFile = buildResult.options.bundlePromisePolyfill === false ? 'steal-sans-promises.production.js' : 'steal.production.js';

        this.bundleRegistration = !(options.bundleRegistration != null);
        this.cacheRegistration = options.cacheRegistration;
        this.registrationTemplate = options.registrationTemplate || path.join(templateDir, "service-worker-registration.tmpl");

        delete options.filename;
        delete options.bundleRegistration;
        delete options.cacheRegistration;

        this.destFolder = buildResult.configuration.dest;
        this.baseUrl = buildResult.loader.baseURL.replace(/^file:/g, "");

        this.options = Object.assign({
            stripPrefix: this.baseUrl,
            templateFilePath: this.swTemplate
        }, options);

        if (!this.options.staticFileGlobs) {
            this.options.staticFileGlobs = [path.join(this.destFolder, '**', '*.*')];
        } else {
            var globs = [];
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = this.options.staticFileGlobs[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var glob = _step.value;

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


    _createClass(ServiceWorker, [{
        key: "create",
        value: function () {
            var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
                return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                if (!(this.bundleRegistration === false && this.cacheRegistration === false)) {
                                    _context.next = 9;
                                    break;
                                }

                                _context.next = 3;
                                return fsUnlink(path.join(this.destFolder, "service-worker-registration.js"));

                            case 3:
                                _context.next = 5;
                                return this._createServiceWorker();

                            case 5:
                                _context.next = 7;
                                return this._createServiceWorkerRegistration();

                            case 7:
                                _context.next = 13;
                                break;

                            case 9:
                                _context.next = 11;
                                return this._createServiceWorkerRegistration();

                            case 11:
                                _context.next = 13;
                                return this._createServiceWorker();

                            case 13:
                            case "end":
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));

            function create() {
                return _ref.apply(this, arguments);
            }

            return create;
        }()

        /**
         * Create the actual service worker file by googls sw-precache
         *
         * @returns {Promise.<*>}
         */

    }, {
        key: "_createServiceWorker",
        value: function () {
            var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
                return regeneratorRuntime.wrap(function _callee2$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                return _context2.abrupt("return", swPrecache.write(path.join(this.destFolder, "..", this.swFilename), this.options));

                            case 1:
                            case "end":
                                return _context2.stop();
                        }
                    }
                }, _callee2, this);
            }));

            function _createServiceWorker() {
                return _ref2.apply(this, arguments);
            }

            return _createServiceWorker;
        }()

        /**
         * Compile the registration template with given variables
         *
         * @returns {Promise.<*>}
         */

    }, {
        key: "_compileSWRegistrationTemplate",
        value: function () {
            var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
                var fileContent, compiled;
                return regeneratorRuntime.wrap(function _callee3$(_context3) {
                    while (1) {
                        switch (_context3.prev = _context3.next) {
                            case 0:
                                _context3.next = 2;
                                return fsReadFile(this.registrationTemplate, { encoding: "utf-8" });

                            case 2:
                                fileContent = _context3.sent;
                                compiled = _template(fileContent);
                                return _context3.abrupt("return", compiled({
                                    swFilename: this.swFilename
                                }));

                            case 5:
                            case "end":
                                return _context3.stop();
                        }
                    }
                }, _callee3, this);
            }));

            function _compileSWRegistrationTemplate() {
                return _ref3.apply(this, arguments);
            }

            return _compileSWRegistrationTemplate;
        }()

        /**
         * create a serice worker registration code and write it to a file
         *
         * @returns {Promise.<void>}
         */

    }, {
        key: "_createServiceWorkerRegistration",
        value: function () {
            var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
                var loader, mains, _mains, stealProd;

                return regeneratorRuntime.wrap(function _callee4$(_context4) {
                    while (1) {
                        switch (_context4.prev = _context4.next) {
                            case 0:
                                if (!this.bundleRegistration) {
                                    _context4.next = 28;
                                    break;
                                }

                                if (!(this.buildResult.buildType === "optimize")) {
                                    _context4.next = 13;
                                    break;
                                }

                                if (!(this.buildResult.options.splitLoader === true)) {
                                    _context4.next = 8;
                                    break;
                                }

                                // first object in the bundles array is the loader
                                loader = this.buildResult.bundles[0];
                                _context4.next = 6;
                                return this._writeIFFE2File(loader.bundlePath);

                            case 6:
                                _context4.next = 11;
                                break;

                            case 8:
                                mains = this._findMains();
                                _context4.next = 11;
                                return this._writeIntoMains(mains);

                            case 11:
                                _context4.next = 26;
                                break;

                            case 13:
                                if (!(this.buildResult.buildType === "build")) {
                                    _context4.next = 25;
                                    break;
                                }

                                if (!(this.buildResult.options.bundleSteal === true)) {
                                    _context4.next = 20;
                                    break;
                                }

                                _mains = this._findMains();
                                _context4.next = 18;
                                return this._writeIntoMains(_mains);

                            case 18:
                                _context4.next = 23;
                                break;

                            case 20:
                                stealProd = path.join(this.destFolder, this.stealProductionFile);
                                _context4.next = 23;
                                return this._writeIFFE2File(stealProd);

                            case 23:
                                _context4.next = 26;
                                break;

                            case 25:
                                throw new Error('steal-sericeworker only supports "build" and "optimize" build-types');

                            case 26:
                                _context4.next = 30;
                                break;

                            case 28:
                                _context4.next = 30;
                                return this._writeIFFE2File(path.join(this.destFolder, "service-worker-registration.js"));

                            case 30:
                            case "end":
                                return _context4.stop();
                        }
                    }
                }, _callee4, this);
            }));

            function _createServiceWorkerRegistration() {
                return _ref4.apply(this, arguments);
            }

            return _createServiceWorkerRegistration;
        }()

        /**
         * Write the IFFE into main's
         *
         * @param mains
         * @returns {Promise.<void>}
         */

    }, {
        key: "_writeIntoMains",
        value: function () {
            var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(mains) {
                var _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, main;

                return regeneratorRuntime.wrap(function _callee5$(_context5) {
                    while (1) {
                        switch (_context5.prev = _context5.next) {
                            case 0:
                                _iteratorNormalCompletion2 = true;
                                _didIteratorError2 = false;
                                _iteratorError2 = undefined;
                                _context5.prev = 3;
                                _iterator2 = mains[Symbol.iterator]();

                            case 5:
                                if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
                                    _context5.next = 12;
                                    break;
                                }

                                main = _step2.value;
                                _context5.next = 9;
                                return this._writeIFFE2File(main);

                            case 9:
                                _iteratorNormalCompletion2 = true;
                                _context5.next = 5;
                                break;

                            case 12:
                                _context5.next = 18;
                                break;

                            case 14:
                                _context5.prev = 14;
                                _context5.t0 = _context5["catch"](3);
                                _didIteratorError2 = true;
                                _iteratorError2 = _context5.t0;

                            case 18:
                                _context5.prev = 18;
                                _context5.prev = 19;

                                if (!_iteratorNormalCompletion2 && _iterator2.return) {
                                    _iterator2.return();
                                }

                            case 21:
                                _context5.prev = 21;

                                if (!_didIteratorError2) {
                                    _context5.next = 24;
                                    break;
                                }

                                throw _iteratorError2;

                            case 24:
                                return _context5.finish(21);

                            case 25:
                                return _context5.finish(18);

                            case 26:
                            case "end":
                                return _context5.stop();
                        }
                    }
                }, _callee5, this, [[3, 14, 18, 26], [19,, 21, 25]]);
            }));

            function _writeIntoMains(_x2) {
                return _ref5.apply(this, arguments);
            }

            return _writeIntoMains;
        }()

        /**
         * Extract the mains out of the bundles array
         *
         * @returns {Array}
         * @private
         */

    }, {
        key: "_findMains",
        value: function _findMains() {
            var mains = [];

            // a array of mains
            var builtMains = this.buildResult.mains;

            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = this.buildResult.bundles[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var bundle = _step3.value;

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

    }, {
        key: "_writeIFFE2File",
        value: function () {
            var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(file) {
                var fileOnly, swRegistrationCode, code, iffe;
                return regeneratorRuntime.wrap(function _callee6$(_context6) {
                    while (1) {
                        switch (_context6.prev = _context6.next) {
                            case 0:
                                fileOnly = false;
                                _context6.next = 3;
                                return this._compileSWRegistrationTemplate();

                            case 3:
                                swRegistrationCode = _context6.sent;

                                swRegistrationCode = UglifyJS.minify(swRegistrationCode);

                                _context6.next = 7;
                                return fsReadFile(file, { encoding: "utf-8" }).catch(function (e) {
                                    fileOnly = true;
                                });

                            case 7:
                                code = _context6.sent;
                                iffe = `(function(){${swRegistrationCode.code}})();`;

                                if (!(fileOnly === true || this.bundleRegistration === false)) {
                                    _context6.next = 14;
                                    break;
                                }

                                _context6.next = 12;
                                return fsWriteFile(file, iffe);

                            case 12:
                                _context6.next = 16;
                                break;

                            case 14:
                                _context6.next = 16;
                                return fsWriteFile(file, iffe + "\n\n" + code);

                            case 16:
                            case "end":
                                return _context6.stop();
                        }
                    }
                }, _callee6, this);
            }));

            function _writeIFFE2File(_x3) {
                return _ref6.apply(this, arguments);
            }

            return _writeIFFE2File;
        }()

        /**
         * Getter
         *
         * @returns {*}
         */

    }, {
        key: "buildResult",
        get: function get() {
            return this._buildResult;
        }
    }]);

    return ServiceWorker;
}();

module.exports = function () {
    var _ref7 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7(buildResult, options) {
        var serviceWorker;
        return regeneratorRuntime.wrap(function _callee7$(_context7) {
            while (1) {
                switch (_context7.prev = _context7.next) {
                    case 0:
                        winston.info("Creating a service worker...");
                        serviceWorker = new ServiceWorker(buildResult, options);
                        _context7.next = 4;
                        return serviceWorker.create();

                    case 4:
                        return _context7.abrupt("return", serviceWorker.buildResult);

                    case 5:
                    case "end":
                        return _context7.stop();
                }
            }
        }, _callee7, this);
    }));

    return function (_x4, _x5) {
        return _ref7.apply(this, arguments);
    };
}();