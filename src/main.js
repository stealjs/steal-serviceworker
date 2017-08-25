// const {promisify} = require('util');
// use native promisify if node 8 lands on steal-tools
const promisify = require("es6-promisify");

const path = require("path");
const fs = require("fs");
const UglifyJS = require("uglify-js");
const swPrecache = require("sw-precache");

const _template = require("lodash.template");

const fsReadFile = promisify(fs.readFile);
const fsWriteFile = promisify(fs.writeFile);
const fsUnlink = promisify(fs.unlink);

/**
 * Creates a service worker for you
 */
class ServiceWorker {
    constructor(buildResult, options) {
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
            throw new Error(
                'Provide a buildResult'
            );
        }

        this.destFolder = buildResult.configuration.dest;
        this.baseUrl = buildResult.loader.baseURL.replace(/^file:/g, "");

        this.options = Object.assign({
            stripPrefix: this.baseUrl,
            templateFilePath: this.swTemplate
        }, options);

        if (!this.options.staticFileGlobs) {
            this.options.staticFileGlobs = [
                path.join(this.destFolder, '**', '*.*')
            ];
        } else {
            let globs = [];
            // go though all the globs and add the baseUrl path to it
            for (let glob of this.options.staticFileGlobs) {
                if (!path.isAbsolute(glob)) {
                    globs.push(path.join(this.baseUrl, glob));
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
    async create() {
        // swap the creation of a service worker because currently we can not exclude
        // a file in staticFileGlobs
        if (this.bundleRegistration === false && this.cacheRegistration === false) {
            await fsUnlink(path.join(this.destFolder, "service-worker-registration.js"));
            await this._createServiceWorker();
            await this._createServiceWorkerRegistration();
        } else {
            await this._createServiceWorkerRegistration();
            await this._createServiceWorker();
        }
    }

    /**
     * Create the actual service worker file by googls sw-precache
     *
     * @returns {Promise.<*>}
     */
    async _createServiceWorker() {
        return swPrecache.write(path.join(this.destFolder, "..", this.swFilename), this.options);
    }

    /**
     * Compile the registration template with given variables
     *
     * @returns {Promise.<*>}
     */
    async _compileSWRegistrationTemplate() {
        let fileContent = await fsReadFile(this.registrationTemplate, {encoding: "utf-8"});
        let compiled = _template(fileContent);
        return compiled({
            swFilename: this.swFilename
        });
    }

    /**
     * create a serice worker registration code and write it to a file
     *
     * @returns {Promise.<void>}
     */
    async _createServiceWorkerRegistration() {
        if (this.bundleRegistration) {
            if(this.buildResult.buildType === "optimize"){
                // slim build
                if(this.buildResult.options.splitLoader === true){
                    // first object in the bundles array is the loader
                    let loader = this.buildResult.bundles[0];
                    await this._writeIFFE2File(loader.bundlePath);

                }else{
                    let mains = this._findMains();
                    await this._writeIntoMains(mains);
                }


            }else if(this.buildResult.buildType === "build"){
                // multibuild
                if (this.buildResult.options.bundleSteal === true) {
                    let mains = this._findMains();

                    await this._writeIntoMains(mains);

                } else {
                    const stealProd = path.join(this.destFolder, "steal.production.js");

                    await this._writeIFFE2File(stealProd);
                }
            } else {
                throw new Error('steal-sericeworker only supports "build" and "optimize" build-types');
            }


        } else {
            // create a new file
            await this._writeIFFE2File(path.join(this.destFolder, "service-worker-registration.js"));
        }
    }

    /**
     * Write the IFFE into main's
     *
     * @param mains
     * @returns {Promise.<void>}
     */
    async _writeIntoMains(mains) {
        for (let main of mains) {
            await this._writeIFFE2File(main)
        }
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

        for (let bundle of this.buildResult.bundles) {
            if (bundle.bundles.length === 1 && bundle.buildType === "js" && builtMains.indexOf(bundle.bundles[0]) > -1) {
                mains.push(bundle.bundlePath);
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
    async _writeIFFE2File(file) {
        let fileOnly = false;
        let swRegistrationCode = await this._compileSWRegistrationTemplate();
        swRegistrationCode = UglifyJS.minify(swRegistrationCode);

        let code = await fsReadFile(file, {encoding: "utf-8"}).catch((e) => {
            fileOnly = true;
        });
        let iffe = `(function(){${swRegistrationCode.code}})();`;

        if (fileOnly === true || this.bundleRegistration === false) {
            await fsWriteFile(file, iffe);
        } else {
            await fsWriteFile(file, iffe + "\n\n" + code);
        }
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

module.exports = async function (buildResult, options) {
    const serviceWorker = new ServiceWorker(buildResult, options);
    await serviceWorker.create();
    return serviceWorker.buildResult;
};
