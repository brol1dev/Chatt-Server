var rest = require('restler');
var Event = require('../models/event.js');
var User = require('../models/user.js');

module.exports.createEvent = function(req, res) {
	var userId = req.params.user_id;
	var title = req.body.title || '';
	var date = req.body.date || Date.now;
	var pub = req.body.pub;

	if (title === '') {
		return res.status(400).json({
			success: false,
			message: 'Specify a title'
		});
	}

	// Find user that creates the event
	User.findById(userId, function(err, user) {
		if (err) {
			console.log(err);
			return handleError(res, 500, 'An error ocurred in the db: ' + err.message);
		}

		if (!user) return res.status(400).json({
			success: false,
			message: 'The specified user_id does not exist'
		});

		var author = {
			user_id: user.id,
			username: user.username,
			email: user.email
		};

		var event = new Event({ 
			title: title,
			author: author,
			pub: pub
		});
		if (!pub) {
			// Create a private event, so, add the author as an user.
			event.users.push(author);
		}

		event.save(function(err) {
			if (err) {
				handleError(res, 500, 'An error ocurred in the db. Try again later.');
				return;
			}

			res.status(201).json({
				'success': true,
				'event': event
			});
		});
	});
	
}

module.exports.eventList = function(req, res) {
	var userId = req.query.user_id || '';

	if (userId === '') {
		handleError(res, 400, 'Specify a user_id.');
		return;
	}

	Event.find({ 'users.user_id': userId }, function(err, privs) {
		if (err) {
			handleError(res, 500, 'An error ocurred in the db. Try again later.');
			return;
		}

		Event.find({ pub: true }, function(err, pubs) {
			if (err) {
				handleError(res, 500, 'An error ocurred in the db. Try again later.');
				return;
			}

			res.status(200).json({
				success: true,
				pub: pubs,
				priv: privs
			});
		});
	});
}

module.exports.addMessage = function(req, res) {
	var eventId = req.params.id || '';
	var fromUserId = req.body.from || '';
	var msg = req.body.msg || '';

	if (eventId === '' || fromUserId === '' || msg === '') {
		handleError(res, 400, 'Specify an event_id, from and msg');
		return;
	}

	var chatMessage = {
		from: fromUserId,
		msg: msg,
		date: Date.now
	};

	Event.findByIdAndUpdate(eventId, { $push: { chat: chatMessage} }, function(err, ev) {
		if (err) {
			console.log(err);
			handleError(res, 500, 'An error ocurred in the db. Try again later.');
			return;
		}

		if (!ev) {
			return res.status(400).json({
				success: false,
				message: 'No event found with that id'
			});
		}

		if (!ev.pub) {
			var devices = [];
			var usersCount = ev.users.length;

			for (var i = 0; i < ev.users.length; i++) {
				User.findById(ev.users[i].user_id, function(err, user) {
					if (err) {
						console.log('Could not send message to ' + ev.users[i].user_id);
						return;
					}

					if (!user) {
						console.log('Could not find user ' + ev.users[i].user_id);
					}

					devices = devices.concat(user.devices);

					if (--usersCount == 0) {
						sendPushNotification(devices);
					}
				});
			};
		}

		res.status(200).json({
			'success': true,
			'event': ev
		});
	});
}

module.exports.addUser = function(req, res) {
	var eventId = req.params.id || '';
	var username = req.body.username || '';

	if (username === '') {
		return handleError(res, 400, 'Specify an username');
	}

	User.find({ username: username }, function(err, users) {
		if (err) return handleError(res, 500, 'An error ocurred in the db. Try again later.');

		if (users.length == 0) return handleError(res, 400, 'No user found with username: ' + username);

		console.log(users);

		Event.findById(eventId, function(err, event) {
			if (err) {
				handleError(res, 500, 'An error ocurred in the db. Try again later.');
				return;
			}

			if (!event) {
				return res.status(400).json({
					success: false,
					message: 'No event found with id: ' + eventId
				});
			}

			console.log(event.users);
			var user = users[0];
			for (var i = 0; i < event.users.length; i++) {
				if (user.id === event.users[i].user_id) {
					console.log('User already exists');
					return res.status(200).json({
						success: true
					});
				}
			};

			var pushUser = {
				user_id: user.id,
				username: user.username,
				email: user.email
			};
			console.log('adding a user');
			console.log(pushUser);
			event.users.push(pushUser);
			console.log(event.users);

			event.save(function(err) {
				if (err) return handleError(res, 500, 'An error ocurred in the db. Try again later.');

				res.status(200).json({
						success: true
					});
			});
		});
	});
}

module.exports.getChat = function(req, res) {
	var eventId = req.params.id || '';

	if (eventId === '') {
		handleError(res, 400, 'Specify an event_id.');
		return;
	}

	Event.findById(eventId, 'chat', function(err, chat) {
		if (err) {
			handleError(res, 500, 'An error ocurred in the db. Try again later.');
			return;
		}

		console.log('chat: ', chat);
		res.status(200).json({
			'success': true,
			'chat': chat.chat
		});
	});
}

function sendPushNotification(devices) {
	var data = {
		registration_ids: devices
	}

	var options = {
		headers: {
			'Authorization': 'key=AIzaSyApg6GJjPAJkzsboKiG846i5h1we-98u1M'
		}
	};

	rest.postJson('https://android.googleapis.com/gcm/send', data, options).on('complete', function(data, response) {
		console.log('gsm response - %s', response.statusCode);
		console.log(data);
	});
}

module.exports.testMessage = function(req, res) {
	var data = {
		'registration_ids': ['APA91bH8MnpCvleSyoQfEbWWGcWkDcXGaT25bV2vafGJ0B9VzkE-TKyzBh8_rhKnDpFGupJjzL4J_uzcJmKb51TtAarOLrdy3xmakkCo6T2hpSP8Ada9_N1bwAAKIA0DpSM6oErIPWmyWjrKjAa-UUSdmT8jT75l49tes6Ce04C5bjdyLCm7w3I'],
		'data': {
			'msg': 'hola mundo!'
		}
	};

	var options = {
		headers: {
			'Authorization': 'key=AIzaSyApg6GJjPAJkzsboKiG846i5h1we-98u1M'
		}
	};
	rest.postJson('https://android.googleapis.com/gcm/send', data, options).on('complete', function(data, response) {
		console.log('gsm response - %s', response.statusCode);
		console.log(data);
	});

	res.status(200).end();
}

function handleError(res, status, msg) {
	console.log('error: ', msg);
	res.status(status).json({
		'success': false,
		'message': msg
	});
}