var ThingModel = require('../models/things.js');
var EventModel = require('../models/events.js');

// Create a thing
exports.createThing = function (req, res) {

	var thing;

	console.log("POST: ");
	console.log(req.body);
	thing = new ThingModel({
		name: req.body.name,
		description: req.body.description,
		following: req.body.following,
		followedBy: req.body.followedBy,
		metadata: req.body.metadata
	});

	thing.save(function (err, thing) {
		if (!err) {
			return res.send(thing);
		} else {
			return res.send(err);
		}
	});
//  return res.send(thing);
};

exports.deleteThing = function(req, res) {
	return ThingModel.findById(req.params.id, function (err, thing) {
		return thing.remove(function (err) {
			if (!err) {
				console.log("removed");
      			// TODO: proper status code
      			return res.send('');
      		} else {
      			return res.send(err);
      		}
      	});
	});
};
