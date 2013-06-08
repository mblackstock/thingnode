var application_root = __dirname,
express = require("express"),
path = require("path"),
mongoose = require('mongoose');

var app = express();

var rtevents = require('./bin/rtevents.js');

// Config

app.configure(function () {
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(application_root, "public")));
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

// Models

var ThingModel = require('./models/things.js');
var EventModel = require('./models/events.js');

// controllers

app.get('/api', function (req, res) {
  res.send('ThingBroker API is running');
});

// List things
app.get('/api/things', function (req, res) {
  return ThingModel.find(function (err, things) {
    if (!err) {
      return res.send(things);
    } else {
      return console.log(err);
    }
  });
});

// Single thing
app.get('/api/things/:id', function (req, res) {
  return ThingModel.findById(req.params.id, function (err, thing) {
    if (!err) {
      return res.send(thing);
    } else {
      return console.log(err);
    }
  });
});

// Create a thing
app.post('/api/things', function (req, res) {
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
});

// delete a thing
app.delete('/api/things/:id', function(req, res) {
	return ThingModel.findById(req.params.id, function (err, thing) {
   return product.remove(function (err) {
     if (!err) {
      console.log("removed");
      // TODO: propery status
      return res.send('');
    } else {
     return res.send(err);
   }
 });
 });
});

// send event
app.post('/api/things/:thingId/events', function(req, res) {
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
});

// get thing events
app.get('/api/things/:thingId/events', function (req, res) {

  var thingId = req.params.thingId;
  var timestamp = req.query.timestamp || 0;


  // TODO: get real time events only if there are none in the db

  if (req.param('realtime') == 'true') {
    rtevents.getRealTime(thingId, timestamp, req, res);
  } else {
    return EventModel.find({'thingId': thingId},
      function (err, events) {
        if (!err) {
          return res.send(events);
        } else {
          return res.send(err);
        }
      }); 
  }
});


// Connect to our Database
mongoose.connect('mongodb://localhost/ecomm_database');

// can we set a timer to clean up?

// Launch server
app.listen(3000);