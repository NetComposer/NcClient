
import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import browserSync from 'browser-sync';
import mocha from 'gulp-mocha';
import webpackStream from 'webpack-stream';
import webpack from 'webpack';
import gutil from 'gulp-util';
import uglify from 'gulp-uglify';
import WebpackDevServer from 'webpack-dev-server';
import webpackConfig from './webpack.config.js';
import sourcemaps from 'gulp-sourcemaps';

const $ = gulpLoadPlugins({lazy: true});

var config = {
    publicDir: './www',
    distDir: 'dist'
};

gulp.task('default', ['clean'], () => { gulp.start('lint'); });

function lint(files, options) {
  return () => {
    return gulp.src(files)
      .pipe(browserSync.reload({stream: true, once: true}))
      .pipe($.eslint(options))
      .pipe($.eslint.format())
      .pipe($.if(!browserSync.active, $.eslint.failAfterError()));
  };
}

gulp.task('lint', lint('www/js/**/*.js'));

gulp.task('lint:test', lint('test/spec/**/*.js', { env: { mocha: true } }));

gulp.task('clean', () => {
    return gulp.src(config.distDir + '/tmp/', { read: false }).pipe($.clean());
});

gulp.task('test', () => {
    gulp.src('test/**/*.js').pipe(mocha())
    .once('error', () => {
        process.exit(1);
    })
    .once('end', () => {
        process.exit();
    })
});

gulp.task('nodemon', [], (cb) => {
    var called = false;
    return $.nodemon({
        script: 'server/server.js',
        watch: ['server/**/*.js', 'server/**/*.json', 'gulpfile.babel.js', 'webpack.config.js']
    }).on('start', function () {
        gutil.log("[nodemon]", "server start...");
        // to avoid nodemon being started multiple times thanks @matthisk
        if (!called) {
            setTimeout(function () {
                cb();
            }, 1500);
        }
        called = true;
    }).on('restart', function () {
        gutil.log("[nodemon]", "server restarted...");
        // reload connected browsers after a slight delay
        setTimeout(function () {
            browserSync.reload({ stream: true });
        }, 500);
    }).on('crash', function (err) {
        gutil.log("[nodemon]", "Error trying to start server...");
        throw new gutil.PluginError("nodemon:crash", err);
    });
});

gulp.task('serve', ['nodemon'], () => {
    process.env.NODE_ENV = 'development';
    setTimeout(function () {
        browserSync({port: 80, proxy: "http://localhost:8000",
            notify: false,
            open: false,
            files: [
                'dist/**/*.html',
                'www/**/*.html',
                'www/css/*.css',
                'www/js/**/*.js',
                'www/img/**/*'
            ]
        });
    }, 500);
    gulp.watch('www/**/*.scss', ['styles']);
    gulp.watch('www/fonts/**/*', ['fonts']);
    // gulp.watch('bower.json', ['wiredep', 'fonts']);
});


gulp.task('pack', [], () => {
    return gulp.src(['www/js/**/*.jsx', 'www/js/**/*.js']) // gulp looks for all source files under specified path
        .pipe(sourcemaps.init()) // creates a source map which would be very helpful for debugging by maintaining the actual source code structure
        .pipe(webpackStream(webpackConfig)) // blend in the webpack config into the source files
        //  watch : true,  devtool: 'source-map'
        .pipe(uglify())// minifies the code for better compression
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('dist/build'));
});

gulp.task('webpack-dev-server', function(callback) {
	// modify some webpack config options
	var myConfig = Object.create(webpackConfig);
	myConfig.devtool = "eval";
	myConfig.debug = true;

	// Start a webpack-dev-server
	new WebpackDevServer(webpack(myConfig), {
        contentBase: myConfig.output.path,
		publicPath: "/" + myConfig.output.publicPath,
        inline: true, hot: true, quiet: false,
        watchOptions: {
            aggregateTimeout: 300,
            poll: 1000
        },
		stats: {
			colors: true
		}
	}).listen(8080, "localhost", function(err) {
		if (err) throw new gutil.PluginError("webpack-dev-server", err);
		gutil.log("[webpack-dev-server]", "http://localhost:8080/webpack-dev-server/index.html");
	});
    gulp.watch('www/js/**/*', ['webpack']);
});


// Build and watch cycle (another option for development)
// Advantage: No server required, can run app from filesystem
// Disadvantage: Requests are not blocked until bundle is available,
//               can serve an old app on refresh
gulp.task("build-dev", ["webpack:build-dev"], function() {
	gulp.watch(["www/js/**/*"], ["webpack:build-dev"]);
});

// Production build
gulp.task("build", ["webpack:build"]);

gulp.task("webpack:build", function(callback) {
	// modify some webpack config options
	var myConfig = Object.create(webpackConfig);
	myConfig.plugins = myConfig.plugins.concat(
		new webpack.DefinePlugin({
			"process.env": {
				// This has effect on the react lib size
				"NODE_ENV": JSON.stringify("production")
			}
		}),
		new webpack.optimize.DedupePlugin(),
		new webpack.optimize.UglifyJsPlugin()
	);

	// run webpack
	webpack(myConfig, function(err, stats) {
		if (err) throw new gutil.PluginError("webpack:build", err);
		gutil.log("[webpack:build]", stats.toString({
			colors: true
		}));
		callback();
	});
});

// modify some webpack config options
var myDevConfig = Object.create(webpackConfig);
myDevConfig.devtool = "sourcemap";
myDevConfig.debug = true;

// create a single instance of the compiler to allow caching
var devCompiler = webpack(myDevConfig);

gulp.task("webpack:build-dev", function(callback) {
	// run webpack
	devCompiler.run(function(err, stats) {
		if (err) throw new gutil.PluginError("webpack:build-dev", err);
		gutil.log("[webpack:build-dev]", stats.toString({
			colors: true
		}));
		callback();
	});
});
