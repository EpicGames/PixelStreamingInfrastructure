// Copyright Epic Games, Inc. All Rights Reserved.
// Adapted from 
// * https://blog.risingstack.com/node-hero-node-js-authentication-passport-js/
// * https://github.com/RisingStack/nodehero-authentication/tree/master/app
// * https://github.com/passport/express-4.x-local-example


const passport = require('passport');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const LocalStrategy = require('passport-local').Strategy;
const path = require('path');
const fs = require('fs');
var db = require('./db');

function initPassport (app) {

	// Generate session secret if it doesn't already exist and save it to file for use next time
	let config = {};
	let configPath = path.join(__dirname, './config.json');
	if (fs.existsSync(configPath)) {
		let content = fs.readFileSync(configPath, 'utf8');
		try {
			config = JSON.parse(content);
		} catch (e) {
			console.log(`Error with config file '${configPath}': ${e}`);
		}
	}

	if(!config.sessionSecret){
		config.sessionSecret = bcrypt.genSaltSync(12);
		let content = JSON.stringify(config);
		fs.writeFileSync(configPath, content);
	}

	// Setup session id settings
	app.use(session({
		secret: config.sessionSecret,
		resave: false,
		saveUninitialized: false,
		cookie: {
			secure: true,
			maxAge: 24 * 60 * 60 * 1000 /* 1 day */
			//maxAge: 5 * 1000 /* 5 seconds */
		}
	}));
	
	app.use(passport.initialize());
	app.use(passport.session());
	
	passport.serializeUser(function(user, cb) {
	 	cb(null, user.id);
	});

	passport.deserializeUser(function(id, cb) {
	 	db.users.findById(id, function (err, user) {
			if (err) { return cb(err); }
			cb(null, user);
		});
	});

	console.log('Setting up auth');
	passport.use(new LocalStrategy(
		(username, password, callback) => {
			db.users.findByUsername(username, (err, user) => {
				if (err) {
					console.log(`Unable to login '${username}', error ${err}`);
					return callback(err);
				}
			
				// User not found
				if (!user) {
					console.log(`User '${username}' not found`);
					return callback(null, false);
				}

				// Always use hashed passwords and fixed time comparison
				bcrypt.compare(password, user.passwordHash, (err, isValid) => {
					if (err) {
						console.log(`Error comparing password for user '${username}': ${err}`);
						return callback(err);
					}
					if (!isValid) {
						console.log(`Password incorrect for user '${username}'`)
						return callback(null, false);
					}

					console.log(`User '${username}' logged in`);
					return callback(null, user);
				});
			})
		}
	));
	
	passport.authenticationMiddleware = function authenticationMiddleware (redirectUrl) {
		return function (req, res, next) {
		    if (req.isAuthenticated()) {
		      return next();
		    }

		    // Set redirectTo property so that user can be redirected back there after logging in
		    //console.log(`Original request path '${req.originalUrl}'`);
		    req.session.redirectTo = req.originalUrl;
		    res.redirect(redirectUrl);
		}
	}
}

module.exports = initPassport;