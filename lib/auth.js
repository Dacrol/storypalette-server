var jwt             = require('jsonwebtoken');
var expressJwt      = require('express-jwt');
var crypto          = require('crypto');

var db;
var secret;
var validateToken;


// Validate password for a user.
// Encrypt password if it isn't already encrypted.
var validPassword = function(db, user, password){
  var utils = {
    md5: function(text){
      return crypto.createHash('md5').update(text).digest('hex');
    },
    encryptPassword: function(password, salt){
      var encrypt = crypto.createCipheriv('bf-ecb', salt+'', '');
      var hex = encrypt.update(password, 'ascii', 'hex');
      hex += encrypt.final('hex');
      return hex;
    }
  };

  if (user.password === password) {
    user.password = utils.encryptPassword(utils.md5(user.password), user._id);
    db.collection('users').update({_id: user._id}, {'$set': {password: user.password}}, function(err) {
      if(err) {console.log(err);}
    });
    return true;
  } else if (user.password == utils.encryptPassword(utils.md5(password), user._id)) {
    return true;
  }

  return false;
};

var authMiddleware = {
  init: function(options) {
    if (!options || !options.secret || !options.db) {
      throw new Error('secret and db must be set');
    }

    secret = options.secret;
    db = options.db;
    validateToken = expressJwt({secret: secret});
  
  },

  requireUser: function(req, res, next) {
    console.log('auth.requireUser'); 

    validateToken(req, res, next);
  },
  
  
  // Route helpers
  // Expects req.body.username and req.body.password
  authenticate: function(req, res) {
    console.log('auth.authenticate', req.body.username);
    var username = req.body.username; 
    var password = req.body.password; 

    db.collection('users').findOne({username: username}, function(err, user) {
      if (err) { console.warn('authenticate error', err); }   

      if (!user) {
        console.warn('authenticate error', err);
        res.status(401).send('User does not exist');
        return;
      }

      if (!validPassword(db, user, password)) {
        res.status(401).send('Wrong password');
        return;
      }

      // Expand organisation.
      db.collection('organisations').findOne({_id: db.ObjectId(user.organisationId.toString())}, function(err, organisation) {
        user.organisation = organisation;

      // Send the user inside the token.
      console.log('Successfully authorized!');
      //delete user.password;

      var token = jwt.sign(user, secret);
      res.json({token: token});
      });
    });
  }

};

module.exports = authMiddleware;



