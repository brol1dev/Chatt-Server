var User = require('../models/user.js');
var jwt = require('jsonwebtoken');

module.exports = {
	createUser: function(req, res) {
		var email = req.body.email || '';
		var password = req.body.password || '';
		var username = req.body.username || '';
		if (!areUserFieldsValid(username, email, password, res)) return;

		User.find({ email: email }, 'email', function(err, users) {
			if (err) {
				handleError(res, 500, 'An error ocurred in the db. Try again later.');
				return;
			}

			if (users.length > 0) {
				handleError(res, 400, 'The email is in use. Do you have an account already?');
				return;
			}

			User.create({ username: username, email: email, password: password}, function(err, user) {
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
	},
	authenticate: function(req, res) {
		var email = req.body.email || '';
		var password = req.body.password || '';
		if (!areUserFieldsValid(email, password, res)) return;

		User.findOne({ email: email, password: password }, '_id email username', function(err, user) {
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
				email: user.email
			};

			var token = jwt.sign(profile, 'secret', { expiresInMinutes: 60 * 24 });
			
			res.status(200).json({
				'success': true,
				'token': token,
				'user': profile
			});
		});
	},
	verifyToken: function(req, res) {
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
	},
	deleteUsers: function(req, res) {
		User.remove(function(err) {
			if (err) {
				handleError(res, 500, 'An error ocurred in the db. Try again later.');
				return;
			}

			res.json({
				'success': true
			});
		});
	}
};

function handleError(res, status, msg) {
	console.log('error: ', msg);
	res.status(status).json({
		'success': false,
		'message': msg
	});
}

function areUserFieldsValid(username, email, password, res) {
		if (email === '' || password === '' || username === '') {
			handleError(res, 400, 'Specify an username, email and password.');
			return false;
		}

		return true;
}