const {promisify} = require('util');
const path = require("path");
const fs = require("fs-extra");
const exist = require("is-there");
const assert = require("chai").assert;
const stealTools = require("steal-tools");

const removeDirAsync = promisify(fs.remove);
const removeFileAsync = promisify(fs.unlink);


const precache = require("../lib/main");


describe("steal-build", function() {

    this.timeout(5000);
    describe("simple", function () {
        before(async () => {

            this.buildResult = await stealTools.build({
                config: __dirname + "/basics/package.json!npm"
            }, {
                quiet: true,
                minify: false
            });

            assert.exists(this.buildResult);
        });

        after(async () => {
            await removeDirAsync(__dirname + "/basics/dist").catch((e) => {});
            await removeFileAsync(path.join(__dirname, "basics", "service-worker.js")).catch(() => {});
            await removeFileAsync(path.join(__dirname, "basics", "sw.js")).catch(() => {});
        });


        it("create a service-worker", (done) => {
            precache(this.buildResult, {}).then(() => {
                const sw = path.join(__dirname,"basics","service-worker.js");

                assert.isTrue(exist.file(sw));

                let swContent = fs.readFileSync(sw, {encoding: "utf-8"});
                assert.match(swContent, /"dist\/bundles\/basic\/index\.js"/gm);
                assert.match(swContent, /"dist\/steal\.production\.js"/gm);

            }).then(done,done);

        });

        it("renamed the service-worker file", (done) => {
            precache(this.buildResult, {
                filename: "sw.js"
            }).then(() => {
                assert.isTrue(exist.file(path.join(__dirname,"basics","sw.js")));
            }).then(done,done);
        });

        it("create a service worker registration and put it into steal", (done) => {
            precache(this.buildResult, {}).then(() => {
                const stealProd = path.join(__dirname,"basics","dist","steal.production.js");
                let content = fs.readFileSync(stealProd, {encoding: "utf-8"});
                assert.match(content, /navigator\.serviceWorker\.register/gm);
            }).then(done, done);
        });

        it("create a separate file for the service worker registration", (done) => {
            precache(this.buildResult, {
                bundleRegistration: false
            }).then(() => {
                assert.isTrue(exist.file(path.join(__dirname,"basics","dist", "service-worker-registration.js")));

                const sw = path.join(__dirname,"basics","service-worker.js");
                assert.isTrue(exist.file(sw));
                let swContent = fs.readFileSync(sw, {encoding: "utf-8"});
                assert.match(swContent, /"dist\/service-worker-registration\.js"/gm);
            }).then(done, done);
        });

        it("do not cache the separate file for service worker registration", (done) => {
            precache(this.buildResult, {
                bundleRegistration: false,
                cacheRegistration: false
            }).then(() => {
                const sw = path.join(__dirname,"basics","service-worker.js");
                assert.isTrue(exist.file(sw));
                let swContent = fs.readFileSync(sw, {encoding: "utf-8"});
                assert.notMatch(swContent, /"dist\/service-worker-registration\.js"/gm);
            }).then(done, done);
        });

        it("custom staticFileGlobs", (done) => {
            precache(this.buildResult, {
                staticFileGlobs: [
                    'dist/bundles/**/*.*',
                ]
            }).then(() => {
                const sw = path.join(__dirname,"basics","service-worker.js");
                let swContent = fs.readFileSync(sw, {encoding: "utf-8"});
                assert.isTrue(exist.file(sw));
                assert.match(swContent, /"dist\/bundles\/basic\/index\.js"/gm);
                assert.notMatch(swContent, /"dist\/steal\.production\.js"/gm);
            }).then(done, done);
        });

        it("should use an service-worker template provided by the user", (done) => {
            precache(this.buildResult, {
                bundleRegistration: false,
                registrationTemplate: path.join(__dirname, "basics", "custom-service-worker-registration.js")
            }).then(() => {
                assert.isTrue(exist.file(path.join(__dirname,"basics","dist", "service-worker-registration.js")));

                const swr = path.join(__dirname,"basics","dist", "service-worker-registration.js");
                let swContent = fs.readFileSync(swr, {encoding: "utf-8"});
                assert.match(swContent, /(ServiceWorker registration successful with scope:)/gm);
            }).then(done, done);
        });

    });

    describe("bundleSteal", function() {
        before(async () => {

            this.buildResult = await stealTools.build({
                config: __dirname + "/basics/package.json!npm"
            }, {
                quiet: true,
                minify: false,
                bundleSteal: true
            });

            assert.exists(this.buildResult);
        });

        after(async () => {
            await removeDirAsync(__dirname + "/basics/dist").catch((e) => {});
            await removeFileAsync(path.join(__dirname, "basics", "service-worker.js")).catch(() => {});
        });

        it("put service worker registration into a bundledSteal file", (done) => {
            precache(this.buildResult, {}).then(() => {
                const stealProd = path.join(__dirname,"basics","dist","bundles","basic","index.js");
                let content = fs.readFileSync(stealProd, {encoding: "utf-8"});
                assert.match(content, /navigator\.serviceWorker\.register/gm);

            }).then(done,done);
        });
    });

    describe("multimain", function () {
        before(async () => {
        });

        after(async () => {
            await removeDirAsync(__dirname + "/multimain/dist").catch((e) => {});
            await removeFileAsync(path.join(__dirname, "multimain", "service-worker.js")).catch(() => {});
        });

        it("build and set service worker registration", async () => {

            this.buildResult = await stealTools.build({
                main: ["main1", "main2"],
                config: __dirname + "/multimain/package.json!npm"
            }, {
                quiet: true,
                minify: false
            });

            await precache(this.buildResult, {}).catch(() => {});

            const sw = path.join(__dirname,"multimain","service-worker.js");
            assert.isTrue(exist.file(sw));

            let swContent = fs.readFileSync(sw, {encoding: "utf-8"});
            assert.match(swContent, /"dist\/bundles\/main1-main2\.js"/gm);
            assert.match(swContent, /"dist\/steal\.production\.js"/gm);
        });

        it("bundleSteal", async () => {
            const buildResult = await stealTools.build({
                main: ["main1", "main2"],
                config: __dirname + "/multimain/package.json!npm"
            }, {
                quiet: true,
                minify: false,
                bundleSteal: true
            });

            await precache(buildResult, {}).catch(()=>{});

            const main1 = path.join(__dirname,"multimain","dist","bundles","main1.js");
            const main2 = path.join(__dirname,"multimain","dist","bundles","main2.js");
            const shared = path.join(__dirname,"multimain","dist","bundles","main1-main2.js");

            let contentMain1 = fs.readFileSync(main1, {encoding: "utf-8"});
            assert.match(contentMain1, /navigator\.serviceWorker\.register/gm);
            let contentMain2 = fs.readFileSync(main2, {encoding: "utf-8"});
            assert.match(contentMain2, /navigator\.serviceWorker\.register/gm);
            let sharedContent = fs.readFileSync(shared, {encoding: "utf-8"});
            assert.notMatch(sharedContent, /navigator\.serviceWorker\.register/gm);
        });

    });

});

describe("slim", function () {
    this.timeout(5000);

    after(async () => {
        await removeDirAsync(__dirname + "/slim/dist").catch((e) => {});
        await removeFileAsync(path.join(__dirname, "slim", "service-worker.js")).catch(() => {});
    });

    it("basic", async () => {
        let buildResult = await stealTools.optimize({
            config: __dirname + "/slim/package.json!npm"
        }, {
            minify: true,
            debug: false,
            quiet: true
        });
        await precache(buildResult, {});

        const sw = path.join(__dirname, "slim", "service-worker.js");
        assert.isTrue(exist.file(sw));
        let swContent = fs.readFileSync(sw, {encoding: "utf-8"});
        assert.match(swContent, /"dist\/bundles\/slim\/main\.js"/gm);
        assert.match(swContent, /"dist\/bundles\/slim\/main\.css"/gm);

        const main = path.join(__dirname,"slim","dist","bundles", "slim", "main.js");
        let content = fs.readFileSync(main, {encoding: "utf-8"});
        assert.match(content, /navigator\.serviceWorker\.register/gm);

    });


    it.skip("multimain", async () => {
        this.buildResult = await stealTools.optimize({
            main: ["main1", "main2"],
            config: __dirname + "/multimain/package.json!npm"
        }, {
            minify: false,
            debug: false,
            quiet: true,
            splitLoader: false
        });
        var foo = "bar";
    });

    it("splitloader", async () => {
        let buildResult = await stealTools.optimize({
            config: __dirname + "/slim/package.json!npm"
        }, {
            minify: false,
            debug: false,
            quiet: true,
            splitLoader: true
        });
        await precache(buildResult, {});

        let slimLoader = buildResult.bundles[0];
        assert.isTrue(exist.file(slimLoader.bundlePath));
        let content = fs.readFileSync(slimLoader.bundlePath, {encoding: "utf-8"});
        assert.match(content, /navigator\.serviceWorker\.register/gm);

    });

    // todo: targeting web only not the node targets
});
