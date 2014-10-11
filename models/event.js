var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var eventSchema = new Schema({
	title: String,
	author: {
		id: String,
		username: String
	},
	date: { type: Date, default: Date.now },
	pub: Boolean,
	users: [{
		id: String,
		username: String
	}],
	chat: [{
		from: String,
		to: String,
		msg: String
	}]
});

module.exports = mongoose.model('Event', eventSchema);