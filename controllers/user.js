var User = require('../models/user.js');
var jwt = require('jsonwebtoken');

module.exports.createUser = function(req, res) {
	var email = req.body.email || '';
	var password = req.body.password || '';
	var username = req.body.username || '';
	var providerId = req.body.provider_id || '';
	var imageUrl = req.body.image_url || '';

	if (!areUserFieldsValid(username, email, password, providerId, res)) return;

	User.find({ email: email }, 'email', function(err, users) {
		if (err) {
			handleError(res, 500, 'An error ocurred in the db. Try again later.');
			return;
		}

		if (users.length > 0) {
			handleError(res, 400, 'The email is in use. Do you have an account already?');
			return;
		}

		User.create({ username: username, email: email, password: password, provider_id: providerId, image_url: imageUrl}, 
				function(err, user) {
			if (err) {
				handleError(res, 500, 'An error ocurred in the db. Try again later.');
				return;
			}

			res.status(201).json({
				'success': true,
				'user': user
			});
		});
	});
}

module.exports.authenticate = function(req, res) {
	var email = req.body.email || '';
	var password = req.body.password || '';
	var providerId = req.body.provider_id || '';
	if (!areUserFieldsValid('', email, password, providerId, res)) return;

	var query = {}
	if (providerId === '') {
		query.email = email;
		query.password = password;
	} else {
		query.email = email;
		query.providerId = providerId;
	}

	User.findOne(query, '_id email username image_url', function(err, user) {
		if (err) {
			handleError(res, 500, 'An error ocurred in the db. Try again later.');
			return;
		}

		if (!user) {
			handleError(res, 401, 'Wrong credentials. Do you have an account?');
			return;
		}

		var profile = {
			id: user._id,
			username: user.username,
			email: user.email,
			image_url: user.image_url
		};

		var token = jwt.sign(profile, 'secret', { expiresInMinutes: 60 * 24 });
		
		res.status(200).json({
			'success': true,
			'token': token,
			'user': profile
		});
	});
}

module.exports.verifyToken = function(req, res) {
	var token = req.body.token || '';

	if (token === '') {
		handleError(res, 400, 'Token not specified.');
		return;
	}
	
	jwt.verify(token, 'secret', function(err, user) {
		if (err) {
			handleError(res, 401, err.message);
			return;
		}

		res.status(201).json({
			'user': user, 
			'token': token
		});
	});
}

function handleError(res, status, msg) {
	console.log('error: ', msg);
	res.status(status).json({
		'success': false,
		'message': msg
	});
}

function areUserFieldsValid(username, email, password, providerId, res) {

		if (providerId === '' && (email === '' || password === '')) {
			handleError(res, 400, 'Specify an email and password.');
			return false;
		} else if (providerId !== '' && email === '') {
			handleError(res, 400, 'Specify an email.');
			return false;
		}

		return true;
}