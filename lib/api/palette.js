// Palette Controller
var db = require('./../db').getDb();

// Return all palettes
exports.list = function(req, res) {
	console.log("Get all palettes");
    db.palettes.find(function(err, palettes) {
      if (!err) {
        res.json(palettes);
      } else {
        console.log(err);
      }
    });
};

// Return palette with :id
exports.get = function(req, res) {
	console.log("Get palette with id " + req.params.id);
	db.palettes.findOne({_id: db.ObjectId(req.params.id)}, function(err, palette) {
		if (!err) {
			res.json(palette);
		}
		else {
			console.log(err);
		}
	});
};

// Delete a palette
exports.destroy = function(req, res) {
	console.log('Deleting palette with id: ' + req.params.id);
    db.palettes.remove({_id: db.ObjectId(req.params.id)}, function(err, result) {
        if (!err) {
            res.json(204, {"result": result});
            // TODO: result=0 when id is wrong but no error is thrown - send 404?
        } else {
            console.log(err);
        }
    });
};


// Update
exports.update = function(req, res) {
	console.log('Updating palette ' + req.body.name);
    // Todo: Mongo doesn't like. Is this the way to do it?
    delete req.body._id;
	db.palettes.update({_id: db.ObjectId(req.params.id)}, req.body, {safe:true}, function(err, result) {
		if(!err) {
			res.json(200, {result: result});    // result === 1 if doc was updated
		} else {
			console.log(err);
		}
	});
};

// Add new palette
exports.create = function(req, res) {
	console.log("Create new palette");
    db.palettes.insert(req.body, function(err, data) {
        if (!err) {
          res.json(200, data[0]);  // palette is first element in array
        } else {
            console.log(err);
        }
    });
};

