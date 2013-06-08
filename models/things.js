
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

// Thing model

var Thing = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: false },
    following: [{ type: Schema.Types.ObjectId, ref: 'Thing' }],
    followedBy: [{ type: Schema.Types.ObjectId, ref: 'Thing' }],
    metadata: {},
    modified: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Thing', Thing);