var express = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var expressJwt = require('express-jwt');
var mongoose = require('mongoose');
var users = require('./controllers/user.js');
var events = require('./controllers/event.js');

var app = express();

/*** Database ***/

// Connect to db
mongoose.connect('mongodb://localhost/chatt');
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'db connection error: '));

db.once('open', function() {
	app.listen(3000, function() {
		console.log('Listening on port %d', this.address().port);
	});
});


/*** Middlewares ***/

// Logger
app.use(morgan('dev'));

app.use('/api', expressJwt({ secret: 'secret' }));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride());


/*** Routes ***/

// Users
app.post('/signup', users.createUser);
app.post('/signin', users.authenticate);
app.post('/logout', users.logout);
// app.post('/verify-token', users.verifyToken); // may stay?

// Events
app.post('/api/event', events.createEvent);
app.get('/api/event', events.eventList);
app.post('/api/event/:id/chat', events.addMessage);
app.get('/api/event/:id/chat', events.getChat);

app.post('/testmsg', events.testMessage);
