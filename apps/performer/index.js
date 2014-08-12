// Storypalette Performer for tablets and phones.

'use strict';

var config    = require('config');
var path      = require('path');
var express   = require('express');
var favicon   = require('serve-favicon');
var logger    = require('morgan');
var app       = express();

// Configuration.
app.use(express.static(config.performer.folder));
app.use(favicon(path.join(config.performer.folder, '/assets/favicon.ico')));

// Routing.
app.all('/*', function(req, res) {
  res.sendfile('index.html', {root: config.performer.folder});
});

console.log('storypalette-performer-touch available at performer.storypalette.*');

module.exports = app;

