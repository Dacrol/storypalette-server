// Storypalette Editor backend.

'use strict';

var config    = require('config');
var path      = require('path');
var express   = require('express');
var favicon   = require('serve-favicon');
var logger    = require('morgan');
var app       = express();

// Configuration.
app.use(express.static(config.editor.folder));
app.use(favicon(path.join(config.editor.folder, '/assets/favicon.ico')));

// Routing.
app.all('/*', function(req, res) {
  res.sendfile('index.html', {root: config.editor.folder});
});

console.log('storypalette-editor available at editor.*');

module.exports = app;

