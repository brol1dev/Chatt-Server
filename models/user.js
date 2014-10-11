var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
	email: String,
	username: String,
	password: String,
	provider_id: String,
	image_url: String,
	devices: [String]
});

module.exports = mongoose.model('User', userSchema);