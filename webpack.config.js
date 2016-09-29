var path = require('path');
var webpack = require('webpack');

var buildPath = path.resolve(__dirname, 'dist', 'build');
var nodeModulesPath = path.resolve(__dirname, 'node_modules');

module.exports = {
	cache: false,
	devtool: 'source-map',
	entry: {
		// DebugData : './www/js/DebugData.js',
		// EchoMedia : './www/js/EchoMedia.js',
		// EventLoggerDb : './www/js/EventLoggerDb.js',
		// EventMngr : './www/js/EventMngr.js',
		// ListenMedia : './www/js/ListenMedia.js',
		NKMedia : ['babel-polyfill', './www/js/NKMedia.js'],
		// PromiseData : './www/js/PromiseData.js',
		// PublishMedia : './www/js/PublishMedia.js',
		RemoteLogMngr: ['babel-polyfill', './www/js/RemoteLogMngr.js'],
		// RoomMngr : './www/js/RoomMngr.js',
		// RtcMedia : './www/js/RtcMedia.js',
		// WsMngr : './www/js/WsMngr.js'
	},
	output: {
		// devtoolLineToLine: true,
        // We need to give Webpack a path. It does not actually need it,
        // because files are kept in memory in webpack-dev-server, but an
        // error will occur if nothing is specified. We use the buildPath
        // as that points to where the files will eventually be bundled
        // in production
		path: buildPath,
        // Everything related to Webpack should go through a build path,
        // localhost:3000/build. That makes proxying easier to handle
		publicPath: '/build/',
		filename: "[name].js",
		libraryTarget: 'var',
		library: "[name]",
		chunkFilename: "[chunkhash].js"
	},
	module: {
		loaders: [
			// required to write "require('./style.css')"
			{ test: /\.css$/,    loader: "style-loader!css-loader" },

			// required for bootstrap icons
			{ test: /\.woff$/,   loader: "url-loader?prefix=font/&limit=5000&mimetype=application/font-woff" },
			{ test: /\.ttf$/,    loader: "file-loader?prefix=font/" },
			{ test: /\.eot$/,    loader: "file-loader?prefix=font/" },
			{ test: /\.svg$/,    loader: "file-loader?prefix=font/" },
			{ test: /\.js$/,
                loader: 'babel-loader',
                exclude: [nodeModulesPath],
                query: {
                    presets: ['es2015']
                }
            }
		]
	},
	resolve: {
		alias: {
			// Bind version of jquery
			jquery: "jquery-2.0.3",

			// Bind version of jquery-ui
			"jquery-ui": "jquery-ui-1.10.3",

			// jquery-ui doesn't contain a index file
			// bind module to the complete module
			"jquery-ui-1.10.3$": "jquery-ui-1.10.3/ui/jquery-ui.js",
		}
	},
	plugins: [
        // We have to manually add the Hot Replacement plugin when running
        // from Node
        new webpack.HotModuleReplacementPlugin(),
		new webpack.ProvidePlugin({
			// Automtically detect jQuery and $ as free var in modules
			// and inject the jquery library
			// This is required by many jquery plugins
			jQuery: "jquery",
			$: "jquery"
		})
	]
};
