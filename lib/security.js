var express = require('express');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var app = express();
var crypto = require('crypto');

var filterUser = function (user) {
  if (user) {
    return {user: user};
  } else {
    return {user: null};
  }
};

// Expand
var expandOrganisation = function(user, cb) {

};

var db;


var encryptPassword = function(password, salt) {
  var md5 = function(text) {
    return crypto.createHash('md5').update(text).digest("hex");
  };

  var md5Pwd = md5(password);
  var encrypt = crypto.createCipheriv('bf-ecb', salt+'', '');
  var hex = encrypt.update(md5Pwd, 'ascii', 'hex');
  hex += encrypt.final('hex');
  return hex;
};

// Validate and encrypt password.
var validPassword = function(db, user, password){
  if (user.password == password) {
    user.password = encryptPassword(user.password, user._id);
    db.collection('users').update({_id: user._id}, {'$set': {password: user.password}}, function(err) {
      if(err) {console.warn(err);}
    });
    return true;
  } else if (user.password == encryptPassword(password, user._id)) {
    return true;
  }

  return false;
};

var security = {
  initialize: function(dbObj) {
    db = dbObj;
    passport.use(new LocalStrategy(
      function(username, password, done) {
        db.collection('users').findOne({username: username}, function(err, user) {
          if (err) { return done(err); }   // server error
          if (!user) {
            return done(null, false, {message: 'Användaren finns inte.'});
          }
          if (!validPassword(db,user,password)) {
            return done(null, false, {message: 'Fel lösenord.'});
          }
          // expand organisation
          db.collection('organisations').findOne({_id: db.ObjectId(user.organisationId.toString())}, function(err, organisation) {
            user.organisation = organisation;
            return done(null, user);
          });
        });
      })
    );
    passport.serializeUser = this.serializeUser;
    passport.deserializeUser = this.deserializeUser;
  },
  serializeUser: function(user, done) {
    //console.log('serializeUser');
    //console.log('-- user', user);
    //console.log('-- done', done);
    done(null, user._id);
  },
  deserializeUser: function(id, done) {
    db.collection('users').findOne({_id:  db.ObjectId(id)}, function(err, user) {
      // expand organisation
      db.collection('organisations').findOne({_id: db.ObjectId(user.organisationId.toString())}, function(err, organisation) {
        user.organisation = organisation;
        done(null, user);
      });
    });
  },
  authenticationRequired: function (req, res, next) {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.json(401, filterUser(req.user));
    }
  },
  adminRequired: function (req, res, next) {
    if (req.user && req.user.role && req.user.role === 'admin') {
      next();
    } else {
      res.json(401, filterUser(req.user));
    }
  },
  sendCurrentUser: function (req, res, next) {
    res.json(200, filterUser(req.user));
  },
  login: function (req, res, next) {
    console.log('login called');
    function authenticationFailed(err, user, info) {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.json(filterUser(user));
      }
      req.logIn(user, function (err) {
        if (err) {
          return next(err);
        }
        return res.json(filterUser(user));
      });
    }
    return passport.authenticate('local', authenticationFailed)(req, res, next);
  },
  logout: function (req, res, next) {
    req.logout();
    res.send(204);
  }
};

module.exports = security;
