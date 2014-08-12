// Resource Controller
var db = require('./../db').getDb();

// Return all resources
exports.list = function(req, res) {
	console.log("Get all resources");
	db.resources.find(function(err, resources) {
		if (!err) {
			res.json(200, resources);
		}
		else {
			console.log(err);
		}
	});
};

// Return resource with :id
exports.get = function(req, res) {
	console.log("Get resource " + req.params.id);
	db.resources.findOne({_id: db.ObjectId(req.params.id)}, function(err, resource) {
		if (!err) {
			res.json(200, resource);
		}
		else {
			console.log(err);
		}
	});
};

// Delete a palette
exports.destroy = function(req, res) {
	console.log('Deleting resource with id: ' + req.params.id);
	db.resources.remove({_id: db.ObjectId(req.params.id)}, function(err, resource) {
		if (!err) {
			res.send(204);
			console.log('Resource removed');
		}
		else {
			console.log(err);
		}
	});
};

// Update a resource
// Hmmm, we're not using the id of the url...
exports.update = function(req, res) {
	console.log('Updating resource ' + req.body.name);
	db.resources.update({_id: db.ObjectId(req.params.id)}, req.body, {safe:true}, function(err, resource) {
		if(!err) {
			res.json(200, resource);
		}
		else {
			console.log(err);
		}
	});
};

// Add new resource
exports.create = function(req, res) {
	console.log("New resource");
	db.resources.insert(req.body, function(err, resource) {
		if (!err) {
			console.log('Resource created');
			res.json(200, resource);
		}
		else {
			console.log(err);
		}
	});
};

