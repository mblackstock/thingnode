
// see long polling example at: https://go-left.com/blog/programming/long-polling-with-node-js/#

// user gets data from a thing providing a timestamp
// look for real time events in the thing->event buffer that match and return.
// if none, add to the thing->request_context map and wait.

// when event sent to any thing, send to itself and all followers.  Goes into their own real time buffer.
// send to waiting users on thing->context map.

/**
 * thing event map (event buffers)
 * 
 * events[thing] = [ event1, event2, ... ]
 */
var events = {};   // map of things to a real time event buffer

/**
 * thing request map
 * pending[thing] = [req, req, req3]
 */
var pending = {}; // map of things to waiting long polling requests

/**
 * thing time map
 * tracks the last time a thing was requested for real time events so we know when to dump the event buffers.
 */
var leases = {};

/**
 * Timeout of a pending request in seconds
 */
var connectionTimeout = 60;
 
/**
* Maximum age of an event buffer in seconds
*/
var maxAge = 60;

/**
* Maximum age of eventBuffer that hasn't been requested in seconds
*/
var maxBufferAge = 5*60;
 

/**
* Maximum age of eventBuffer that hasn't been requested in seconds
*/
var cleanupInterval = 60;

/**
 * Global counter for unique ids for real time requests
 */
var lastRequestId = 0;

function currentTimestamp() {
    return new Date().getTime();
}

function debug(thingId, requestId, message) {
    if (message) {
        console.log("["+thingId+"/"+requestId+"] " + message);        
    } else {
        console.log("["+thingId+"] " + requestId);                
    }
}

function compact(arr) {
    if (!arr) return null;
    var i, data = [];
    for (i=0; i < arr.length; i++) {
        if (arr[i]) data.push(arr[i]);
    }
    return data;
}

function addEvent(thingId, event) {

    if (!events[thingId]) 
        return false; // noone is waiting for events
        
    events[thingId].push(event);
    debug(thingId, "P", "added " + JSON.stringify(event));
    return true;
}

function nextEvents(thingId, timestamp) {
    if (!events[thingId]) return null;
    if (!timestamp) timestamp = 0;
    
    // - loop over the events for the thingId
    // - timeout events older than maxAge seconds
    // - return the oldest event with a timestamp 
    //   greater than 'timestamp'
    var event, i;
    var minTimestamp = currentTimestamp() - maxAge * 1000;
    var retEvents = [];
    for(i=0; i < events[thingId].length; i++) {
        event = events[thingId][i];
        
        // can we remove this old event?
        if (event.timestamp < minTimestamp) {
            debug(thingId, "expired " + JSON.stringify(event));
            events[thingId][i] = null;
            continue;
        } 
        
        // next event?
        if (event.timestamp > timestamp) {
            retEvents.push(event);
        }
    }
    
    // compact the event array, removing old ones
    events[thingId] = compact(events[thingId]);
    
    // return the new events
    return retEvents;
}

function pause(thingId, timestamp, req, res, requestId) {
    if (!pending[thingId]) 
        pending[thingId] = [];
 
    // save the request context
    var ctx = {
        id : requestId, 
        timestamp : timestamp, 
        req : req, 
        res : res
    }; 
    pending[thingId].push(ctx);
    
    // configure a timeout on the request
    req.connection.setTimeout(connectionTimeout * 1000);
    req.connection.on('timeout', function(){  
        ctx.req = null;
        ctx.res = null;
        debug(thingId, requestId, "timeout");
    });
    
    // pause the request
    req.pause();        
    debug(thingId, requestId, "paused");
}

/**
 * notify requests waiting on events from the specified thing
 */
function notify(thingId) {
  if (!pending[thingId]) return;

    // loop over pending requests for the thing
    // and respond if an event is available    
    var i, ctx, retEvents;
    for (i=0; i < pending[thingId].length; i++) {
      ctx = pending[thingId][i];

        // ctx.req == null -> timeout, cleanup
        if (!ctx.req) {
          pending[thingId][i] = null;
          continue;
        } 

        // get next events from the buffer
        retEvents = nextEvents(thingId, ctx.timestamp);

        // thing has events to return? -> respond, close and cleanup
        if (retEvents) {
          ctx.req.resume();
          ctx.res.send(retEvents);  
          ctx.res.end();              
          pending[thingId][i] = null;
          debug(thingId, ctx.id , "sent " + JSON.stringify(retEvents)); 
        }
      }  

    // compact the list of pending requests
    pending[thingId] = compact(pending[thingId]);
  }


// exported module calls

/**
 * send a real time event to waiting requests if any
 */
exports.sendRealTime = function(thingId, event) {

    // add the event to the thing/event map buffer
    if (addEvent(thingId, event)) {
      // if there is an event queue, notify pending real time thing event requests
      notify(thingId);    

    }
  }

/**
 * get real time events after the specified timestamp, or wait for new ones to arrive
 */
 exports.getRealTime = function(thingId, timestamp, req, res) {

  // someone has asked for real time events, but we're not saving them yet,
  // create a real buffer for the next events
  if (!events[thingId])
    events[thingId] = [];

  // update the lease so we can garbage collect the buffers later
  leases[thingId] = currentTimestamp();

 	//TODO: save that a user has requested real time events.
  console.log("getting thing real time events from "+thingId);

  // add a close handler for the connection
  req.connection.on('close', function(){  
    console.log(requestId, "close");
  });

  var requestId = lastRequestId++;

  // get the next event
  var retEvents = nextEvents(thingId, timestamp);
  
  // pause the request if there is no pending event
  // or send the event
  if (retEvents.length == 0) {
    pause(thingId, timestamp, req, res, requestId);
  } else {
    res.send(retEvents);
    res.end();
    console.log(thingId, requestId, "sent " + JSON.stringify(events));
  }
}

// if the lease has expired, dump event buffers.
setInterval(function(){
  console.log('buffer clean up: '+new Date());
  var curTime = currentTimestamp();
  for (var thingId in leases) {
     if (curTime > leases[thingId] + (maxBufferAge*1000)) {
       console.log("removing events for "+thingId);
       delete events[thingId];
       delete leases[thingId];
     }
  }

}, cleanupInterval*1000);
