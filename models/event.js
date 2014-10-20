var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var eventSchema = new Schema({
	title: String,
	author: {
		user_id: String,
		username: String,
		email: String
	},
	date: { type: Date, default: Date.now },
	pub: Boolean,
	users: [{
		user_id: String,
		username: String,
		email: String
	}],
	chat: [{
		from: String,
		msg: String,
		date: Date
	}]
});

module.exports = mongoose.model('Event', eventSchema);