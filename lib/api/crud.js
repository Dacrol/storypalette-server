// Basic, reusable CRUD operations
var db = require('./../db').getDb();

// coll = collection name
module.exports = function(coll, opts) {

  return {
    one: function(req, res) {
      console.log('CRUD: Get', coll, 'item with id', req.params.id + ',');
      db[coll].findOne({_id: db.ObjectId(req.params.id)}, function(err, item) {
        if (!err) {
          res.json(item);
        } else {
          console.log(err);
        }
      });
    }, 
    all: function(req, res) {
      console.log('CRUD: Get all', coll + '.');
      db[coll].find(function(err, items) {
        if (!err) {
          res.json(items);
        } else {
          console.log(err);
        }
      });
    },
    create: function(req, res) {
      console.log('CRUD: Create new', coll, 'item.');
      db[coll].insert(req.body, function(err, item) {
        if (!err) {
          res.json(item); 
        } else {
          console.log(err);
        }
      });
    },
    update: function(req, res) {
      console.log('CRUD: Updating', coll, 'item', req.params.id + '.');
      // TODO: Mongo complains. Is this the way to do it?
      delete req.body._id;
      db[coll].update({_id: db.ObjectId(req.params.id)}, req.body, {safe: true}, function(err, result) {
        if(!err) {    
          // result == 1 if doc was updated
          res.json({result: result});
        } else {
          console.log(err);
        }
      });
    },
    destroy: function(req, res) {
      console.log('CRUD: Deleting', coll, 'item with id', req.params.id, '.');
      db[coll].remove({_id: db.ObjectId(req.params.id)}, function(err, result) {
        if (!err) {
          // TODO: result=0 when id is wrong but no error is thrown - send 404?
          res.status(204).end();
        } else {
          console.log(err);
        }
      });
    }
  };
};

