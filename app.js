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

var controllers = require('./bin/controllers.js');

app.get('/api', function (req, res) {
  res.send('ThingBroker API is running');
});

// List things
app.get('/api/things', controllers.getThings);

// Single thing
app.get('/api/things/:id', controllers.getThing);

// Create a thing
app.post('/api/things', controllers.createThing);

// delete a thing
app.delete('/api/things/:id', controllers.deleteThing);

// send event
app.post('/api/things/:thingId/events', controllers.sendEvent);

// get thing events
app.get('/api/things/:thingId/events', controllers.getEvents);

// Connect to our Database
mongoose.connect('mongodb://localhost/ecomm_database');

// Launch server
app.listen(3000);