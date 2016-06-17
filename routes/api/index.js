// Storypalette API

var _  = require('lodash');
var config = require('config');
var path = require('path');
var http = require('http');
var express = require('express');
var mongo = require('mongojs');
var querystring = require('querystring');
var db = require('../../lib/db').getDb({
  user: config.db.user,
  password: config.db.password,
  name: config.db.name,
}, config.db.collections);
var api = require('../../lib/api');
var app = module.exports = express();
var socketioJwt = require('socketio-jwt');

// Ssetup sockets
var io = global.io;

// We use one socket-namespace per organisation
var sioNamespaces = [];
var orgs = {};

db.collection('organisations').find(function (err, organisations) {
  if (err) {
    console.log(err);
  } else {
    setupSockets(organisations);
  }
});

function setupSockets(organisations) {
  // One socket.io namespace for each organisation
  for (var i = 0; i < organisations.length; i++) {
    var org = organisations[i];
    console.log('Socket namespace "' + org._id + '" for ' + org.name);
    // store for visualisation lookup
    orgs['/' + org._id] = org.name;

    // Require token in querystring.
    io.of('/' + org._id).use(socketioJwt.authorize({
      secret: config.server.tokenSecret,
      handshake: true
    }));

    sioNamespaces[i] = io.of('/' + org._id)
      .on('connection', function(socket) {
        console.log('>>> Socket connected:', socket.id, '(' + socket.decoded_token.username + ')');
        socket.spUser = {
          userId: socket.decoded_token._id,
          username:  socket.decoded_token.username,
          role:  socket.decoded_token.role
        };

        // Join a room
        socket.on('join', function(room) {
          // Store roomname for later use
          socket.spRoom = room;

          // Join the room
          socket.join(room);

          // Tell the client that it joined the room
          socket.emit('onJoin');
        });

        // Player --> Performer
        socket.on('activePalette', function(palette) {
          console.log('>>> activePalette', palette.name);
          socket.broadcast.to(socket.spRoom).emit('onActivePalette', palette);
        });

        // Performer --> Player
        socket.on('requestPalette', function(paletteId) {
          console.log('>>> requestPalette', paletteId);
          socket.broadcast.to(socket.spRoom).emit('onRequestPalette', paletteId);
        });
        socket.on('paletteDeactivate', function() {
          console.log('>>> paletteDeactivate');
          socket.broadcast.to(socket.spRoom).emit('onPaletteDeactivate');
        });
        // data = {paletteId, assetId, value}
        socket.on('valueUpdate', function(data) {
          //console.log('>>> valueUpdate value.raw=', data.value.raw);
          socket.broadcast.to(socket.spRoom).emit('onValueUpdate', data);
        });

        // ??
        socket.on('paletteUpdate', function(palette) {
          console.log('>>> paletteUpdate', palette.name);
          socket.broadcast.to(socket.spRoom).emit('onPaletteUpdate', palette);
        });

        socket.on('disconnect', function() {
          console.log('>>> socket disconnected');
          socket.broadcast.to(socket.spRoom).emit('onDisconnect', 'number of clients left');
          //socket.get('user', function(err, user) {
            //console.log('>>> Client "' + user.username + '" (' + socket.id + ') disconnected');
          //});
        });
      }
    );
  }
} // setupSockets


// Get info about currently connected users/sockets
app.get(apiBase + 'info/activity', function(req, res) {
  var info = {};
  
  // Get all room names per namespace
  _.each(io.nsps, function(ns) {
    info[ns.name] = {
      name: ns.name, 
      organisationName: orgs[ns.name],
      rooms: {}
    };

    // All the sockets connected to this namespace.
    _.each(ns.connected, function(socket) {
      if (!info[ns.name].rooms[socket.spRoom]) {
        info[ns.name].rooms[socket.spRoom] = {
          name: socket.spRoom,
          clients: []
        };
      }

      info[ns.name].rooms[socket.spRoom].clients.push({
        socketId: socket.id,
        user: socket.spUser
      });
    });
  });

  delete info['/'];
  res.json(info);
});

module.exports = app;

