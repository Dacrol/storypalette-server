// Storypalette Player backend.
// Serves the interface files for the native app.

'use strict';

var config    = require('config');
var path      = require('path');
var express   = require('express');
var favicon   = require('serve-favicon');
var logger    = require('morgan');
var app       = express();

// Configuration.
app.use(express.static(config.player.folder));
app.use(favicon(path.join(config.player.folder, '/assets/favicon.ico')));

// Routing.
app.get('/*', function(req, res) {
  res.sendfile('index.html', {root: config.player.folder});
});

console.log('storypalette-player available at player.storypalette.*');

module.exports = app;

