var ThingModel = require('../models/things.js');
var EventModel = require('../models/events.js');
var rtevents = require('./rtevents.js');


exports.getThings = function (req, res) {
  return ThingModel.find(function (err, things) {
    if (!err) {
      return res.send(things);
    } else {
      return console.log(err);
    }
  });
};

exports.getThing = function (req, res) {
  return ThingModel.findById(req.params.id, function (err, thing) {
    if (!err) {
      return res.send(thing);
    } else {
      return console.log(err);
    }
  });
};


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

exports.sendEvent = function(req, res) {
	var thingId = req.params.thingId;
  console.log("POST: ");
  console.log(req.body);

  var event = new EventModel({
    thingId: thingId,
    timestamp: new Date().getTime(),
    data: req.body
  });

  // in case people are waiting for real time events
  rtevents.sendRealTime(thingId, event);

  // save event for later
  event.save(function (err, thing) {
    if (!err) {
      return res.send(thing);
    } else {
      return res.send(err);
    }
  });
};


exports.getEvents = function (req, res) {

  var thingId = req.params.thingId;
  var timestamp = req.query.timestamp || 0;

  return EventModel.find({'thingId': thingId, 'timestamp': {$gt: timestamp}},
    function (err, events) {
      if (!err) {
        if (events.length != 0) {
          return res.send(events);
        }
        rtevents.getRealTime(thingId, timestamp, req, res);
      } else {
        return res.send(err);
      }
    });
};
