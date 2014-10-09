var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
	email: String,
	username: String,
	password: String,
	provider_id: String,
	image_url: String,
	devices: [String]
});

module.exports = mongoose.model('User', userSchema);