var mongojs = require('mongojs');
var db;

exports.getDb = function(uri) {
  if (!db) {
    if (!uri) {
      throw new Error('Please provide a database uri');
    }
  }

  if (!db)  {
    console.log(`Connecting to db ${uri}`);
    db = mongojs(uri);
  }

	return db;
};
