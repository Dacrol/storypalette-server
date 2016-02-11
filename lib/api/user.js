// User Controller
var db = require('./../db').getDb();
var crud = require('./crud')('users');

// Returns an array of all the users with role='player' in the specified user's organisation.
// 'Player users' are the accounts logged into the Player computers in physical Storypalette rooms.
// /api/users/:id/players
var getPlayers = function(req, res) {
  console.log('API: Get Players for user ', req.params.id);
  // first find user
  db.users.findOne({_id: db.ObjectId(req.params.id)}, function(err, user) {
    // now find the player(s) for this user
    db.users.find({organisationId: db.ObjectId(user.organisationId.toString()), role: 'player'}).toArray(function(err, players) {
      if(!err) {
        res.status(200).json(players);
      } else {
        console.log(err);
      }
    });
  });
};

module.exports = {
  all: crud.all,
  one: crud.one,
  create: crud.create,
  update: crud.update,
  destroy: crud.destroy,
  getPlayers: getPlayers
};




