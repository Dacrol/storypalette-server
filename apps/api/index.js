// Storypalette API

'use strict';

var _               = require('lodash');
var config          = require('config');
var path            = require('path');
var http            = require('http');
var express         = require('express');
var bodyParser      = require('body-parser');
var cors            = require('cors');
var mongo           = require('mongojs');
var querystring     = require('querystring');
var db              = require('../../lib/db').getDb(config.db.name, config.db.collections);
var auth            = require('../../lib/auth');
var api             = require('../../lib/api');
var app = module.exports = express();
var expressJwt      = require('express-jwt');
var fileManager     = require('../../lib/fileManager')(app, config);

// Init authorization middleware.
auth.init({
  db: db,
  secret: config.server.tokenSecret
});

app.all('/imago', function(req, res) {
  console.log('imago');
  res.send('imago');
});
// Middleware //////////////////////////////

// Enable CORS for everything (for now)
app.use(cors());

// Parse application/json, TODO: Do we need urlencoded?
app.use(bodyParser.json());

//app.use(function(req, res, next) {
  //if (req.url.match("/file")) return next();
  //sessionMiddleware(req, res, next);
//});


var apiBase = '/v1/';

// API status and info.
app.all(apiBase, api.info.main);

// Authentication API.
app.post(apiBase + 'authenticate', auth.authenticate);

// Media API.
app.get(apiBase + 'image/*', fileManager.getImage);
app.get(apiBase + 'sound/*', fileManager.getSound);
app.post(apiBase + 'file/*', fileManager.postFile);

// Palette API.
app.get(apiBase + 'palettes', auth.requireUser, api.palette.list);
app.get(apiBase + 'palettes/:id', api.palette.get);
app.post(apiBase + 'palettes', api.palette.create);
app.put(apiBase + 'palettes/:id', api.palette.update);
app.delete(apiBase + 'palettes/:id', api.palette.destroy);
app.get(apiBase + 'resources', api.resource.list);
app.get(apiBase + 'resources/:id', api.resource.get);
app.post(apiBase + 'resources', api.resource.create);
app.put(apiBase + 'resources/:id', api.resource.update);
app.delete(apiBase + 'resources/:id', api.resource.destroy);
app.get(apiBase + 'users', api.user.list);
app.get(apiBase + 'users/:id', api.user.get);
app.post(apiBase + 'users', api.user.create);
app.delete(apiBase + 'users/:id', api.user.remove);
app.get(apiBase + 'users/:id/players', api.user.getPlayers);
app.get(apiBase + 'organisations', api.organisation.list);
app.get(apiBase + 'organisations/:id', api.organisation.get);


/*
app.namespace(apiBase + '*', function() {
  app.all('/', function(req, res, next) {
    if (req.method !== 'GET') {
      // Authentication needed  to modify collections
      security.authenticationRequired(req, res, next);
    } else {
      next();
    }
  });
});

// Authentication API.
app.post('/login', security.login);
app.post('/logout', security.logout);
app.get('/current-user', security.sendCurrentUser);


// Retrieve the current user only if they are authenticated
app.get('/authenticated-user', function(req, res) {
  security.authenticationRequired(req, res, function() { security.sendCurrentUser(req, res); });
});

// Retrieve the current user only if they are admin
app.get('/admin-user', function(req, res) {
  security.adminRequired(req, res, function() { security.sendCurrentUser(req, res); });
});
*/

//  



// Ssetup sockets
var io = global.io;

//var parseCookie = connect.utils.parseCookie;
//var cookie = require('express/node_modules/cookie');

/*
io.use(passportSocketIo.authorize({
  cookieParser: connect.cookieParser,
  key:    config.server.sessionKey,     // the cookie where express stores its session id.
  secret: config.server.cookieSecret,   // the session secret to parse the cookie
  store:   sessionStore,                // the session store that express uses

  fail: function(data, message, error, accept) {   
    if(error)  { 
      // Fatal error - not just authorization issue.
      throw new Error(message);
    }

    // send the (not-fatal) error-message to the client and deny the connection
    console.warn('>>> SOCKET NOT AUTHORZIED');
    return accept(new Error(message));
  },

  success: function(data, accept) {
    console.log('>>> SOCKET AUTHORZIED');
    accept();
  }
}));
*/

/**
io.use(function(socket, next) {
  if (typeof data.headers.cookie !== 'undefined') {
    passportSocketIoAuth(data, accept);
  } else if (typeof data.query !== 'undefined') {
    if (typeof data.query.cookie !== 'undefined') {
      console.log('Player emulated cookie with querystring: ', data.query.cookie);
      data.headers.cookie = querystring.unescape(data.query.cookie);
      passportSocketIoAuth(data, accept);
    }
  } else {
    accept('Socket.io authorization failed!', false);
  }
});
*/

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
    console.log('Using socket.io namespace "' + org._id + '" for ' + org.name);
    // store for visualisation lookup
    orgs['/' + org._id] = org.name;

    sioNamespaces[i] = io.of('/' + org._id)
      .on('connection', function(socket) {
        console.log('>>> Socket client connected: ', socket.id);

        // Join a room
        socket.on('join', function(room) {

          console.log('socket.join room=', room);

          var user = socket.request.user;
          if (socket.handshake.user) {
            // Store user info for later visualisation uses
            // TODO: fix!
            socket.spUser = {_id: user._id, username: user.username, role: user.role};
            console.log('User "' + user.username + '" joined room "' + room + '"');
          }


          //console.log('')
          // Store roomname for later use
          socket.spRoom = room;
          socket.spApa = 'knasboll';

          // Join the room
          socket.join(room);

          // Tell the client that it joined the room
          socket.emit('onJoin', room);
        });

        // Editor
        socket.on('activePalette', function(palette) {
          console.log('>>> activePalette', palette.name);
          socket.broadcast.to(socket.spRoom).emit('onActivePalette', palette);
        });
        socket.on('paletteDeactivate', function() {
          console.log('>>> paletteDeactivate');
          socket.broadcast.to(socket.spRoom).emit('onPaletteDeactivate');
        });
        socket.on('paletteUpdate', function(palette) {
          console.log('>>> paletteUpdate', palette.name);
          socket.broadcast.to(socket.spRoom).emit('onPaletteUpdate', palette);
        });

        // erformer
        socket.on('requestPalette', function(paletteId) {
          console.log('>>> requestPalette', paletteId);
          socket.broadcast.to(socket.spRoom).emit('onRequestPalette', paletteId);
        });

        // Performer
        // data = {paletteId, assetId, value}
        socket.on('valueUpdate', function(data) {
          console.log('>>> valueUpdate - data=', data);
          socket.broadcast.to(socket.spRoom).emit('onValueUpdate', data);
        });


        socket.on('disconnect', function() {
          console.log('>>> socket disconnected');
          //socket.get('user', function(err, user) {
            //console.log('>>> Client "' + user.username + '" (' + socket.id + ') disconnected');
          //});
        });
      }
    );
  }

/*
function findClientsSocket(roomId, namespace) {
    var res = []
    , ns = io.of(namespace ||"/");    // the default namespace is "/"

    if (ns) {
        for (var id in ns.connected) {
            if(roomId) {
                var index = ns.connected[id].rooms.indexOf(roomId) ;
                if(index !== -1) {
                    res.push(ns.connected[id]);
                }
            } else {
                res.push(ns.connected[id]);
            }
        }
    }
    return res;
}
*/

} // setupSockets

// UI: 51ac6ecbf54d7d411c000007

// Get info about currently connected users/sockets
app.get(apiBase + 'info/activity', function(req, res) {
  var info = {};

  // Get namespace names
  //var nsNames = _.keys(io.nsps); 
  //nsKeys.shift(); // remove first element (global namespace '')
  
  // Get all room names per namespace
  console.log(_.rest(io.nsps).length);
  _.each(io.nsps, function(ns) {
    info[ns.name] = {
      name: ns.name, 
      organisationName: orgs[ns.name],
      rooms: {}
    };

    //info[ns.name].rooms = _.chain(ns.sockets)
      //.filter(function(socket) {return socket.rooms.length > 1;})
      //.map(function(socket) {return _.rest(socket.rooms);})
      //.value();

    // All the sockets connected to this namespace.
    _.each(ns.connected, function(socket) {
      info[ns.name].rooms[socket.spRoom] = {
        name: socket.spRoom,
        socketId: socket.id
        //userId: user._id,
        //username: user.username,
        //role: user.role
      };
    });
  });

  console.log(JSON.stringify(info, null, 2));

  delete info['/'];
  res.json(info);
});

//var server  = http.createServer(app);
//var io      = require('socket.io').listen(server);

module.exports = app;
console.log('Storypalette API available at api.*');

