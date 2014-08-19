var Event = require('../models/event.js');

module.exports.createEvent = function(req, res) {
	var title = req.body.title || '';
	var authorId = req.body.author.id || '';
	var authorName = req.body.author.username || '';
	var date = req.body.date || Date.now;
	var pub = req.body.pub || true;

	if (!areFieldsValid(title, authorId, authorName, res)) return;

	Event.create({ 
		title: title, 
		'author.id': authorId, 
		'author.username': authorName,  
		pub: pub
	}, 
	function(err, ev) {
		if (err) {
			handleError(res, 500, 'An error ocurred in the db. Try again later.');
			return;
		}

		res.status(201).json({
			'success': true,
			'event': ev
		});
	});
}

module.exports.eventList = function(req, res) {
	var userId = req.query.user_id || '';

	if (userId === '') {
		handleError(res, 400, 'Specify a user_id.');
		return;
	}

	Event.find({ 'users.id': userId }, function(err, privs) {
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
				'success': true,
				'pub': pubs,
				'priv': privs
			});
		});
	});
}

module.exports.addMessage = function(req, res) {
	var eventId = req.params.id || '';
	var chatMessage = req.body;

	console.log('params: ', req.params);
	console.log('body: ', req.body);

	if (eventId === '') {
		handleError(res, 400, 'Specify an event_id.');
		return;
	}

	Event.findByIdAndUpdate(eventId, { $push: { chat: chatMessage} }, function(err, ev) {
		if (err) {
			handleError(res, 500, 'An error ocurred in the db. Try again later.');
			return;
		}

		res.status(200).json({
			'success': true,
			'event': ev
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

function areFieldsValid(title, authorId, authorName, res) {
	if (title === '' || authorId === '' || authorName === '') {
		handleError(res, 400, 'Specify a title, author.id and author.username.');
		return false;
	}

	return true;
}

function handleError(res, status, msg) {
	console.log('error: ', msg);
	res.status(status).json({
		'success': false,
		'message': msg
	});
}