var mongojs = require('mongojs');
var db;

exports.getDb = function(name, collections) {
  if (!db && !name) {
    throw new Error('Please provide a database name');
  }

  collections = collections || [];

  if (!db)  {
    console.log('Connecting to db: ' + name);
    db = mongojs(name, collections);
  }

	return db;
};
