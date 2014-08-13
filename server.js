// Main server file.

'use strict';

console.log('\n***********************************************************\n');

var config = require('config');
var express = require('express');
var logger = require('morgan');
var vhost = require('vhost');
var app = express();
var server = require('http').Server(app);
var env = require('./lib/env')(config);

// Make socket available for all apps.
global.io = require('socket.io')(server);

// Pass server environment info to client.
app.get('/env.js', env);

// Storypalette apps are vhosts in subdomains.
app.use(vhost('api.storypalette.*', require('./apps/api')));
app.use(vhost('editor.storypalette.*', require('./apps/editor')));
app.use(vhost('performer.storypalette.*', require('./apps/performer')));
app.use(vhost('player.storypalette.*', require('./apps/player')));

// Middleware for all apps.
app.use(logger('dev'));


app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});


// Start server.
var port = process.env.PORT || config.server.port;
server.listen(port, function() {
  console.log('storypalette-server listening on port %d in %s mode', port, app.settings.env);
});
