// Organisation Controller
var db = require('./../db').getDb();

// Return all organisations
exports.list = function(req, res) {
	console.log("Get all organisations");
	db.organisations.find(function(err, organisations) {
		if (!err) {
			res.status(200).json(organisations);
		}
		else {
			console.log(err);
		}
	});
};

// Return organisation with :id
exports.get = function(req, res) {
	console.log("Get organisation " + req.params.id);
	db.organisations.findOne({_id: db.ObjectId(req.params.id)}, function(err, user) {
		if (!err) {
			res.status(200).json(user);
		}
		else {
			console.log(err);
		}
	});
};
