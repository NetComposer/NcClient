var express = require('express');
var path = require('path');
var app = express();
var morgan = require('morgan')
var httpProxy = require('http-proxy');
var proxy = httpProxy.createProxyServer();

// respond with "hello world" when a GET request is made to the homepage app.get('/', function(req, res) { res.send('hello world'); });
// app.use(express.static(__dirname + '\\..\\www'));
// app.use('/js', express.static(__dirname + '\\..\\www\\js'));

var logger = morgan('combined');
app.use(logger);

var isProduction = process.env.NODE_ENV === 'production';
var port = process.env.PORT || 8000;

app.use(express.static(path.resolve(__dirname, '../dist')));
// app.use(express.static(path.resolve(__dirname, '../node_modules')));

app.start = function () {
    // start the web server
    return app.listen(port, function () {
        app.emit('started');
        console.log('Web server started');
    });
};

// It is important to catch any errors from the proxy or the
// server will crash. An example of this is connecting to the
// server when webpack is bundling
proxy.on('error', function (e) {
    app.emit('crash', e);
    console.log('Could not connect to proxy, please try again...');
});

// We only want to run the workflow when not in production
if (!isProduction) {

    // Any requests to localhost:3000/build is proxied
    // to webpack-dev-server
    app.all('/build/*', function (req, res) {
        proxy.web(req, res, {
            target: 'http://localhost:8080'
        });
    });

    // We require the bundler inside the if block because
    // it is only needed in a development environment. Later
    // you will see why this is a good idea
    var bundle = require('./bundle.js');
    bundle(function (err) {
        if (err) {
            console.log('Could not compile bundle, please fix and try again...');
        }
    });
}

if (require.main === module) {
    app.start();
}
