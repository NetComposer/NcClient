var Webpack = require('webpack');
var WebpackDevServer = require('webpack-dev-server');
var webpackConfig = require('./../webpack.config.js');
var path = require('path');
var fs = require('fs');
var mainPath = path.resolve(__dirname, '..', 'app', 'main.js');

module.exports = function (cb) {

    // First we fire up Webpack an pass in the configuration we
    // created
    var bundleStart = null;
    var compiler = Webpack(webpackConfig);

    // We give notice in the terminal when it starts bundling and
    // set the time it started
    compiler.plugin('compile', function () {
        console.log('Bundling...');
        bundleStart = Date.now();
    });

    compiler.plugin('failed', function (err) {
        console.log('Failed:  ', err);
        cb(err);
    });

    var bundler = new WebpackDevServer(compiler, {
        // We need to tell Webpack to serve our bundled application
        // from the build path. When proxying:
        // http://localhost:3000/build -> http://localhost:8080/build
        publicPath: '/build/',

        // Configure hot replacement
        hot: true,

        // The rest is terminal configurations
        quiet: false,
        noInfo: true,
        stats: {
            colors: true
        }
    });

    // We also give notice when it is done compiling, including the
    // time it took. Nice to have
    compiler.plugin('done', function (stats) {
        stats.toJson('normal');
        if (stats.hasErrors()) {
            return cb(stats.toJson('errors-only'));
        }

        console.log('Bundled in ' + (Date.now() - bundleStart) + 'ms!');
        // We fire up the development server and give notice in the terminal
        // that we are starting the initial bundle
        bundler.listen(8080, 'localhost', function () {
            console.log('WebpackDevServer listening...');
            cb();
        });
    });

};
