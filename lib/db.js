var mongojs = require('mongojs');
var db;

exports.getDb = function(config, collections) {
  if (!db) {
    if (!config.name) {
      throw new Error('Please provide a database name');
    } else if (!config.user) {
      throw new Error('Please provide a database user name');
    } else if (!config.password) {
      throw new Error('Please provide a database user password');
    }
  }

  collections = collections || [];

  if (!db)  {
    var uri = config.user + ':' + config.password + '@' + config.name;
    console.log('Connecting to db ' + config.name);
    db = mongojs(uri, collections);
  }

	return db;
};
