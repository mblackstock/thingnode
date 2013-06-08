var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var Event = new Schema({
//	timestamp: { type: Date, default: Date.now },
	timestamp: { type: Number },
	thingId: {type: Schema.Types.ObjectId, ref: 'Thing', required:true},
	data: {}
})

module.exports = mongoose.model('Event', Event);