// User Controller
var db = require('./../db').getDb();

// Return all users
exports.list = function(req, res) {
	console.log("Get all users");
	db.users.find(function(err, users) {
		if (!err) {
			res.json(200, users);
		}
		else {
			console.log(err);
		}
	});
};

// Return user with :id
exports.get = function(req, res) {
	console.log("Get user " + req.params.id);
	db.users.findOne({_id: db.ObjectId(req.params.id)}, function(err, user) {
		if (!err) {
			res.json(200, user);
		}
		else {
			console.log(err);
		}
	});
};

// Returns an array of all the users with role='player' in the specified user's organisation.
// 'Player users' are the accounts logged into the Player computers in physical Storypalette rooms.
// /api/users/:id/players
exports.getPlayers = function(req, res) {
  console.log('API: Get Players for user ', req.params.id);
  // first find user
  db.users.findOne({_id: db.ObjectId(req.params.id)}, function(err, user) {
    // now find the player(s) for this user
    db.users.find({organisationId: db.ObjectId(user.organisationId.toString()), role: 'player'}).toArray(function(err, players) {
      if(!err) {
        res.json(200, players);
      } else {
        console.log(err);
      }
    });
  });
};

// Add new use
exports.create = function(req, res) {
	console.log("New user");
	db.users.insert(req.body, function(err, user) {
		if (!err) {
			console.log('User created');
			res.json(200, user);
		}
		else {
			console.log(err);
		}
	});
};

exports.remove = function(req, res) {
	console.log('Deleting user with id: ' + req.params.id);
  db.users.remove({_id: db.ObjectId(req.params.id)}, function(err, result) {
    if (!err) {
      res.status(204).end();
    } else {
      console.warn(err);
    }
  });
};

