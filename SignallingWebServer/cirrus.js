// Copyright Epic Games, Inc. All Rights Reserved.

//-- Server side logic. Serves pixel streaming WebRTC-based page, proxies data back to Streamer --//

var express = require('express');
var app = express();

const fs = require('fs');
const path = require('path');
const querystring = require('querystring');
const bodyParser = require('body-parser');
const logging = require('./modules/logging.js');
logging.RegisterConsoleLogger();

// Command line argument --configFile needs to be checked before loading the config, all other command line arguments are dealt with through the config object

const defaultConfig = {
	UseFrontend: false,
	UseMatchmaker: false,
	UseHTTPS: false,
	UseAuthentication: false,
	LogToFile: true,
	LogVerbose: true,
	HomepageFile: 'player.html',
	AdditionalRoutes: new Map(),
	EnableWebserver: true,
	MatchmakerAddress: "",
	MatchmakerPort: 9999,
	PublicIp: "localhost",
	HttpPort: 80,
	HttpsPort: 443,
	StreamerPort: 8888,
	SFUPort: 8889,
	MaxPlayerCount: -1
};

const argv = require('yargs').argv;
var configFile = (typeof argv.configFile != 'undefined') ? argv.configFile.toString() : path.join(__dirname, 'config.json');
console.log(`configFile ${configFile}`);
const config = require('./modules/config.js').init(configFile, defaultConfig);

if (config.LogToFile) {
	logging.RegisterFileLogger('./logs/');
}

console.log("Config: " + JSON.stringify(config, null, '\t'));

var http = require('http').Server(app);

if (config.UseHTTPS) {
	//HTTPS certificate details
	const options = {
		key: fs.readFileSync(path.join(__dirname, './certificates/client-key.pem')),
		cert: fs.readFileSync(path.join(__dirname, './certificates/client-cert.pem'))
	};

	var https = require('https').Server(options, app);
}

//If not using authetication then just move on to the next function/middleware
var isAuthenticated = redirectUrl => function (req, res, next) { return next(); }

if (config.UseAuthentication && config.UseHTTPS) {
	var passport = require('passport');
	require('./modules/authentication').init(app);
	// Replace the isAuthenticated with the one setup on passport module
	isAuthenticated = passport.authenticationMiddleware ? passport.authenticationMiddleware : isAuthenticated
} else if (config.UseAuthentication && !config.UseHTTPS) {
	console.error('Trying to use authentication without using HTTPS, this is not allowed and so authentication will NOT be turned on, please turn on HTTPS to turn on authentication');
}

const helmet = require('helmet');
var hsts = require('hsts');
var net = require('net');

var FRONTEND_WEBSERVER = 'https://localhost';
if (config.UseFrontend) {
	var httpPort = 3000;
	var httpsPort = 8000;

	//Required for self signed certs otherwise just get an error back when sending request to frontend see https://stackoverflow.com/a/35633993
	process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

	const httpsClient = require('./modules/httpsClient.js');
	var webRequest = new httpsClient();
} else {
	var httpPort = config.HttpPort;
	var httpsPort = config.HttpsPort;
}

var streamerPort = config.StreamerPort; // port to listen to Streamer connections
var sfuPort = config.SFUPort;

var matchmakerAddress = '127.0.0.1';
var matchmakerPort = 9999;
var matchmakerRetryInterval = 5;
var matchmakerKeepAliveInterval = 30;
var maxPlayerCount = -1;

var gameSessionId;
var userSessionId;
var serverPublicIp;

// `clientConfig` is send to Streamer and Players
// Example of STUN server setting
// let clientConfig = {peerConnectionOptions: { 'iceServers': [{'urls': ['stun:34.250.222.95:19302']}] }};
var clientConfig = { type: 'config', peerConnectionOptions: {} };

// Parse public server address from command line
// --publicIp <public address>
try {
	if (typeof config.PublicIp != 'undefined') {
		serverPublicIp = config.PublicIp.toString();
	}

	if (typeof config.HttpPort != 'undefined') {
		httpPort = config.HttpPort;
	}

	if (typeof config.HttpsPort != 'undefined') {
		httpsPort = config.HttpsPort;
	}

	if (typeof config.StreamerPort != 'undefined') {
		streamerPort = config.StreamerPort;
	}

	if (typeof config.SFUPort != 'undefined') {
		sfuPort = config.SFUPort;
	}

	if (typeof config.FrontendUrl != 'undefined') {
		FRONTEND_WEBSERVER = config.FrontendUrl;
	}

	if (typeof config.peerConnectionOptions != 'undefined') {
		clientConfig.peerConnectionOptions = JSON.parse(config.peerConnectionOptions);
		console.log(`peerConnectionOptions = ${JSON.stringify(clientConfig.peerConnectionOptions)}`);
	} else {
		console.log("No peerConnectionConfig")
	}

	if (typeof config.MatchmakerAddress != 'undefined') {
		matchmakerAddress = config.MatchmakerAddress;
	}

	if (typeof config.MatchmakerPort != 'undefined') {
		matchmakerPort = config.MatchmakerPort;
	}

	if (typeof config.MatchmakerRetryInterval != 'undefined') {
		matchmakerRetryInterval = config.MatchmakerRetryInterval;
	}

	if (typeof config.MaxPlayerCount != 'undefined') {
		maxPlayerCount = config.MaxPlayerCount;
	}
} catch (e) {
	console.error(e);
	process.exit(2);
}

if (config.UseHTTPS) {
	app.use(helmet());

	app.use(hsts({
		maxAge: 15552000  // 180 days in seconds
	}));

	//Setup http -> https redirect
	console.log('Redirecting http->https');
	app.use(function (req, res, next) {
		if (!req.secure) {
			if (req.get('Host')) {
				var hostAddressParts = req.get('Host').split(':');
				var hostAddress = hostAddressParts[0];
				if (httpsPort != 443) {
					hostAddress = `${hostAddress}:${httpsPort}`;
				}
				return res.redirect(['https://', hostAddress, req.originalUrl].join(''));
			} else {
				console.error(`unable to get host name from header. Requestor ${req.ip}, url path: '${req.originalUrl}', available headers ${JSON.stringify(req.headers)}`);
				return res.status(400).send('Bad Request');
			}
		}
		next();
	});
}

sendGameSessionData();

//Setup the login page if we are using authentication
if(config.UseAuthentication){
	if(config.EnableWebserver) {
		app.get('/login', function(req, res){
			res.sendFile(path.join(__dirname, '/Public', '/login.html'));
		});
	}

	// create application/x-www-form-urlencoded parser
	var urlencodedParser = bodyParser.urlencoded({ extended: false })

	//login page form data is posted here
	app.post('/login', 
		urlencodedParser, 
		passport.authenticate('local', { failureRedirect: '/login' }), 
		function(req, res){
			//On success try to redirect to the page that they originally tired to get to, default to '/' if no redirect was found
			var redirectTo = req.session.redirectTo ? req.session.redirectTo : '/';
			delete req.session.redirectTo;
			console.log(`Redirecting to: '${redirectTo}'`);
			res.redirect(redirectTo);
		}
	);
}

if(config.EnableWebserver) {
	//Setup folders
	app.use(express.static(path.join(__dirname, '/Public')))
	app.use('/images', express.static(path.join(__dirname, './images')))
	app.use('/scripts', [isAuthenticated('/login'),express.static(path.join(__dirname, '/scripts'))]);
	app.use('/', [isAuthenticated('/login'), express.static(path.join(__dirname, '/custom_html'))])
}

try {
	for (var property in config.AdditionalRoutes) {
		if (config.AdditionalRoutes.hasOwnProperty(property)) {
			console.log(`Adding additional routes "${property}" -> "${config.AdditionalRoutes[property]}"`)
			app.use(property, [isAuthenticated('/login'), express.static(path.join(__dirname, config.AdditionalRoutes[property]))]);
		}
	}
} catch (err) {
	console.error(`reading config.AdditionalRoutes: ${err}`)
}

if(config.EnableWebserver) {

	// Request has been sent to site root, send the homepage file
	app.get('/', isAuthenticated('/login'), function (req, res) {
		homepageFile = (typeof config.HomepageFile != 'undefined' && config.HomepageFile != '') ? config.HomepageFile.toString() : defaultConfig.HomepageFile;
		
		let pathsToTry = [ path.join(__dirname, homepageFile), path.join(__dirname, '/Public', homepageFile), path.join(__dirname, '/custom_html', homepageFile), homepageFile ];

		// Try a few paths, see if any resolve to a homepage file the user has set
		for(let pathToTry of pathsToTry){
			if(fs.existsSync(pathToTry)){
				// Send the file for browser to display it
				res.sendFile(pathToTry);
				return;
			}
		}

		// Catch file doesn't exist, and send back 404 if not
		console.error('Unable to locate file ' + homepageFile)
		res.status(404).send('Unable to locate file ' + homepageFile);
		return;
	});
}

//Setup http and https servers
http.listen(httpPort, function () {
	console.logColor(logging.Green, 'Http listening on *: ' + httpPort);
});

if (config.UseHTTPS) {
	https.listen(httpsPort, function () {
		console.logColor(logging.Green, 'Https listening on *: ' + httpsPort);
	});
}

console.logColor(logging.Cyan, `Running Cirrus - The Pixel Streaming reference implementation signalling server for Unreal Engine 5.1.`);

let nextStreamerId = 1;
let nextPlayerId = 1;

let streamers = new Map();		// streamerId <-> streamer socket
let players = new Map(); 		// playerId <-> player, where player is either a web-browser or a native webrtc player
let SFUPlayerId = null;

function sfuIsConnected() {
	if (SFUPlayerId) {
		let sfuPlayer = players.get(SFUPlayerId);
		return sfuPlayer && sfuPlayer.ws && sfuPlayer.sfu.readyState == 1;
	}
	return false;
}

function logIncoming(sourceName, msgType, msg) {
	if (config.LogVerbose)
		console.logColor(logging.Blue, "\x1b[37m-> %s\x1b[34m: %s", sourceName, msg);
	else
		console.logColor(logging.Blue, "\x1b[37m-> %s\x1b[34m: %s", sourceName, msgType);
}

function logOutgoing(destName, msgType, msg) {
	if (config.LogVerbose)
		console.logColor(logging.Green, "\x1b[37m<- %s\x1b[32m: %s", destName, msg);
	else
		console.logColor(logging.Green, "\x1b[37m<- %s\x1b[32m: %s", destName, msgType);
}

// normal peer to peer signalling goes to streamer. SFU streaming signalling goes to the sfu
function sendMessageFromPlayer(playerId, msg, skipSFU, skipStreamer = false) {
	console.error(`sendMessageFromPlayer(${playerId}, ${msg}, ${skipSFU}, ${skipStreamer})`);
	let player = players.get(playerId);
	if (player) {
		msg.playerId = playerId;
		const rawMsg = JSON.stringify(msg);

		let streamerId = player.streamerId;
		if (!streamerId) {
			console.error(`sendMessageFromPlayer: Player ${playerId} not subscribed to any streamer`);
		} else {
			let streamer = streamers.get(streamerId);
			if (!streamer) {
				console.error(`sendMessageFromPlayer: Player ${playerId} subscribed to non-existent streamer: ${streamerId}`);
			} else {
				if (!skipSFU && SFUPlayerId) {
					let sfuPlayer = players.get(SFUPlayerId);
					if (sfuPlayer && sfuPlayer.ws && sfuPlayer.ws.readyState == 1) {
						logOutgoing(`SFU ${streamerId}`, msg.type, rawMsg);
						streamer.sfu.send(rawMsg);
						return;
					}
				}
				if (!skipStreamer && streamer.readyState == 1) {
					logOutgoing(`Streamer ${streamerId}`, msg.type, rawMsg);
					streamer.send(rawMsg);
					return;
				}
			}
		}
		
		console.error(`sendMessageFromPlayer: Failed to send message.\nMSG: ${rawMsg}`);
	} else {
		console.error(`sendMessageFromPlayer: Unable to find player ${playerId}.`);
	}
}

function sendMessageToPlayer(playerId, msg) {
	let player = players.get(playerId);
	if (!player) {
		console.log(`dropped message ${msg.type} as the player ${playerId} is not found`);
	} else {
		const playerName = playerId == SFUPlayerId ? "SFU" : `player ${playerId}`;
		const rawMsg = JSON.stringify(msg);
		logOutgoing(playerName, msg.type, rawMsg);
		player.ws.send(rawMsg);
	}
}

let WebSocket = require('ws');

let streamerMessageHandlers = new Map();
let sfuMessageHandlers = new Map();
let playerMessageHandlers = new Map();

function sanitizePlayerId(playerId) {
	if (playerId && typeof playerId === 'number') {
		playerId = playerId.toString();
	}
	return playerId;
}

function getPlayerIdFromMessage(msg) {
	return sanitizePlayerId(msg.playerId);
}

function onStreamerDisconnected(streamerId) {
	let streamer = streamers.get(streamerId);
	if (!streamer) {
		console.error(`Disconnecting streamer ${streamerId} does not exist.`);
	} else {
		sendStreamerDisconnectedToMatchmaker(streamerId);
		unsubscribeAllPlayers(streamerId);
		if (SFUPlayerId) {
			let sfuPlayer = players.get(SFUPlayerId);
			if (sfuPlayer && sfuPlayer.streamerId == streamerId) {
				const msg = { type: "streamerDisconnected" };
				sfuPlayer.ws.send(JSON.stringify(msg));
			}
		}
		streamers.delete(streamerId);
	}
}

function onPingStreamerMessage(msg) {
	const pongMsg = JSON.stringify({ type: "pong", time: msg.time});
	let playerId = getPlayerIdFromMessage(msg);
	sendMessageToPlayer(playerId, pongMsg, true);
}

function onDisconnectPlayerStreamerMessage(msg) {
	let playerId = getPlayerIdFromMessage(msg);
	let player = players.get(playerId);
	if (player) {
		player.ws.close(1011 /* internal error */, msg.reason);
	}
}

function forwardMessageToPlayer(msg) {
	let playerId = getPlayerIdFromMessage(msg);
	sendMessageToPlayer(playerId, msg);
}

console.logColor(logging.Green, `WebSocket listening for Streamer connections on :${streamerPort}`)
let streamerServer = new WebSocket.Server({ port: streamerPort, backlog: 1 });
streamerServer.on('connection', function (ws, req) {
	let streamerId = (nextStreamerId++).toString();

	console.logColor(logging.Green, `Streamer ${streamerId} connected: ${req.connection.remoteAddress}`);
	sendStreamerConnectedToMatchmaker(streamerId);

	streamerMessageHandlers.set('ping', onPingStreamerMessage);
	streamerMessageHandlers.set('offer', forwardMessageToPlayer);
	streamerMessageHandlers.set('answer', forwardMessageToPlayer);
	streamerMessageHandlers.set('iceCandidate', forwardMessageToPlayer);
	streamerMessageHandlers.set('disconnectPlayer', onDisconnectPlayerStreamerMessage);

	ws.on('message', (msgRaw) => {
		var msg;
		try {
			msg = JSON.parse(msgRaw);
		} catch(err) {
			console.error(`Cannot parse Streamer message: ${msgRaw}\nError: ${err}`);
			ws.close(1008, 'Cannot parse');
			return;
		}

		logIncoming(`Streamer ${streamerId}`, msg.type, msgRaw);
		try {
			let handler = streamerMessageHandlers.get(msg.type);
			if (!handler) {
				console.error(`unsupported Streamer message type: ${msg.type}`);
				ws.close(1008, 'Unsupported message type');
				return;
			}
			handler(msg);
		} catch(err) {
			console.error(`ERROR: ws.on message error: ${err.message}`);
		}
	});
	
	ws.on('close', function(code, reason) {
		console.error(`streamer ${streamerId} disconnected: ${code} - ${reason}`);
		onStreamerDisconnected(streamerId);
	});

	ws.on('error', function(error) {
		console.error(`streamer ${streamerId} connection error: ${error}`);
		onStreamerDisconnected(streamerId);
		try {
			ws.close(1006 /* abnormal closure */, error);
		} catch(err) {
			console.error(`ERROR: ws.on error: ${err.message}`);
		}
	});

	streamers.set(streamerId, ws);
	ws.send(JSON.stringify(clientConfig));

	// subscribe any sfu to the latest connected streamer
	if (SFUPlayerId) {
		let sfuPlayer = players.get(SFUPlayerId);
		if (sfuPlayer && sfuPlayer.ws && sfuPlayer.readyState == 1) {
			const msg = { type: "playerConnected", playerId: SFUPlayerId, dataChannel: true, sfu: true };
			ws.send(JSON.stringify(msg));
			sfuPlayer.streamerId = streamerId;
		}
	}
});

function forwardSFUMessageToStreamer(msg) {
	sendMessageFromPlayer(SFUPlayerId, msg, true);
}

function onPeerDataChannelsSFUMessage(msg) {
	// sfu is telling a peer what stream id to use for a data channel
	const playerId = getPlayerIdFromMessage(msg);
	sendMessageToPlayer(playerId, msg);
	// remember the player has a data channel
	const player = players.get(playerId);
	if (player) {
		player.datachannel = true;
	}
}

console.logColor(logging.Green, `WebSocket listening for SFU connections on :${sfuPort}`);
let sfuServer = new WebSocket.Server({ port: sfuPort});
sfuServer.on('connection', function (ws, req) {
	// reject if we already have an sfu
	if (sfuIsConnected()) {
		ws.close(1013, 'Already have SFU');
		return;
	}

	SFUPlayerId = sanitizePlayerId(nextPlayerId++);

	sfuMessageHandlers.set('offer', forwardMessageToPlayer);
	sfuMessageHandlers.set('answer', forwardSFUMessageToStreamer);
	sfuMessageHandlers.set('streamerDataChannels', forwardSFUMessageToStreamer);
	sfuMessageHandlers.set('peerDataChannels', onPeerDataChannelsSFUMessage);

	ws.on('message', (msgRaw) => {
		var msg;
		try {
			msg = JSON.parse(msgRaw);
		} catch (err) {
			console.error(`Cannot parse SFU message: ${msgRaw}\nError: ${err}`);
			ws.close(1008, 'Cannot parse');
			return;
		}

		logIncoming("SFU", msg.type, msgRaw);
		try {
			let handler = sfuMessageHandlers.get(msg.type);
			if (!handler) {
				console.error(`unsupported SFU message type: ${msg.type}`);
				ws.close(1008, 'Unsupported message type');
				return;
			}
			handler(msg);
		} catch(err) {
			console.error(`ERROR: ws.on message error: ${err.message}`);
		}
	});

	ws.on('close', function(code, reason) {
		console.error(`SFU disconnected: ${code} - ${reason}`);
		SFUPlayerId = null;
		disconnectSFUPlayer();
	});

	ws.on('error', function(error) {
		console.error(`SFU connection error: ${error}`);
		SFUPlayerId = null;
		disconnectSFUPlayer();
		try {
			ws.close(1006 /* abnormal closure */, error);
		} catch(err) {
			console.error(`ERROR: ws.on error: ${err.message}`);
		}
	});

	// TODO subscribe it to one of any of the streamers for now
	let streamerId = null;
	let streamer = null;
	for (let [sId, sObj] of streamers) {
		streamerId = sId;
		streamer = sObj;
		break;
	}

	players.set(SFUPlayerId, { ws: ws, id: SFUPlayerId, streamerId: streamerId });
	console.logColor(logging.Green, `SFU (${req.connection.remoteAddress}) connected `);

	if (streamer && streamer.readyState == 1) {
		const msg = { type: "playerConnected", playerId: SFUPlayerId, dataChannel: true, sfu: true };
		streamer.send(JSON.stringify(msg));
	}
});

let playerCount = 0;

function subscribePlayer(playerId, streamerId) {
	let valid = false;

	let player = players.get(playerId);
	if (!player) {
		console.error(`Tried to subscribe player ${playerId} but it does not exist.`);
		return;
	}

	if (!streamerId) {
		console.error(`Player ${player.id} tried to subscribe to a streamer but didnt provide a streamer id.`);
	} else {
		streamerId = streamerId.toString();
		if (!streamers.has(streamerId)) {
			console.error(`Player ${player.id} tried to subscribe to a streamer that doesnt exist.`);
		} else {
			valid = true;
		}
	}

	if (!valid) {
		// if we didnt subscribe, just subscribe to whatever stream
		for (let [sId, streamer] of streamers) {
			streamerId = sId;
			valid = true;
			break;
		}
	}

	if (valid) {
		player.streamerId = streamerId;
		sendMessageFromPlayer(player.id, { type: "playerConnected", dataChannel: true, sfu: false }, player.skipSFU, player.skipStreamer);
		sendPlayersCount();
		player.ws.send(JSON.stringify(clientConfig));
	} else {
		console.error(`Did not find a streamer to subscribe to.`);
	}
}

function sendPlayersCount() {
	let playerCountMsg = JSON.stringify({ type: 'playerCount', count: players.size });
	for (let p of players.values()) {
		p.ws.send(playerCountMsg);
	}
}

function onSubscribePlayerMessage(player, msg) {
	subscribePlayer(player.id, msg.streamerId);
}

function onUnsubscribePlayerMessage(player, msg) {
	unsubscribePlayer(player.id);
}

function onStatsPlayerMessage(player, msg) {
	console.log(`player ${playerId}: stats\n${msg.data}`);
}

function forwardPlayerMessage(player, msg) {
	sendMessageFromPlayer(player.id, msg, player.skipSFU, player.skipStreamer);
}

function forwardPlayerMessageToStreamer(player, msg) {
	sendMessageFromPlayer(player.id, msg, true, false);
}

function forwardPlayerMessageToSFU(player, msg) {
	sendMessageFromPlayer(player.id, msg, false, true);
}

function onPlayerDisconnected(playerId) {
	try {
		const player = players.get(playerId);
		if (player.datachannel) {
			// have to notify the streamer that the datachannel can be closed
			sendMessageFromPlayer(playerId, { type: 'playerDisconnected' }, true, false);
		}
		if (player.streamerId) {
			sendMessageFromPlayer(playerId, { type: 'playerDisconnected' }, player.skipSFU);
			sendPlayerDisconnectedToFrontend(player.streamerId);
			sendPlayerDisconnectedToMatchmaker(player.streamerId);
		}
		players.delete(playerId);
		--playerCount;
		sendPlayersCount();
	} catch(err) {
		console.logColor(logging.Red, `ERROR:: onPlayerDisconnected error: ${err.message}`);
	}
}

console.logColor(logging.Green, `WebSocket listening for Players connections on :${httpPort}`);
let playerServer = new WebSocket.Server({ server: config.UseHTTPS ? https : http});
playerServer.on('connection', function (ws, req) {
	var url = require('url');
	const parsedUrl = url.parse(req.url);
	const urlParams = new URLSearchParams(parsedUrl.search);
	const preferSFU = urlParams.has('preferSFU') && urlParams.get('preferSFU') !== 'false';
	const skipSFU = !preferSFU;
	const skipStreamer = preferSFU && sfu;

	if (preferSFU && !SFUPlayerId) {
		ws.send(JSON.stringify({ type: "warning", warning: "Even though ?preferSFU was specified, there is currently no SFU connected." }));
	}

	if (playerCount + 1 > maxPlayerCount && maxPlayerCount !== -1)
	{
		console.logColor(logging.Red, `new connection would exceed number of allowed concurrent connections. Max: ${maxPlayerCount}, Current ${playerCount}`);
		ws.close(1013, `too many connections. max: ${maxPlayerCount}, current: ${playerCount}`);
		return;
	}

	++playerCount;
	let playerId = sanitizePlayerId(nextPlayerId++);
	console.logColor(logging.Green, `player ${playerId} (${req.connection.remoteAddress}) connected`);
	players.set(playerId, { ws: ws, id: playerId, skipSFU: skipSFU, skipStreamer: skipStreamer });

	playerMessageHandlers.set('subscribe', onSubscribePlayerMessage);
	playerMessageHandlers.set('unsubscribe', onUnsubscribePlayerMessage);
	playerMessageHandlers.set('stats', onStatsPlayerMessage);
	playerMessageHandlers.set('offer', forwardPlayerMessage);
	playerMessageHandlers.set('answer', forwardPlayerMessage);
	playerMessageHandlers.set('iceCandidate', forwardPlayerMessage);
	playerMessageHandlers.set('dataChannelRequest', forwardPlayerMessageToSFU);
	playerMessageHandlers.set('peerDataChannelsReady', forwardPlayerMessageToSFU);

	ws.on('message', (msgRaw) =>{
		var msg;
		try {
			msg = JSON.parse(msgRaw);
		} catch (err) {
			console.error(`Cannot parse player ${playerId} message: ${msgRaw}\nError: ${err}`);
			ws.close(1008, 'Cannot parse');
			return;
		}

		let player = players.get(playerId);
		if (!player) {
			console.error(`Received a message from a player not in the player list ${playerId}`);
			ws.close(1001, 'Broken');
			return;
		}

		logIncoming(`player ${playerId}`, msg.type, msgRaw);
		try {
			let handler = playerMessageHandlers.get(msg.type);
			if (!handler) {
				console.error(`unsupported player message type: ${msg.type}`);
				ws.close(1008, 'Unsupported message type');
				return;
			}
			handler(player, msg);
		} catch(err) {
			console.error(`ERROR: ws.on message error: ${err.message}`);
		}
	});

	ws.on('close', function(code, reason) {
		console.logColor(logging.Yellow, `player ${playerId} connection closed: ${code} - ${reason}`);
		onPlayerDisconnected(playerId);
	});

	ws.on('error', function(error) {
		console.error(`player ${playerId} connection error: ${error}`);
		ws.close(1006 /* abnormal closure */, error);
		onPlayerDisconnected(playerId);

		console.logColor(logging.Red, `Trying to reconnect...`);
		reconnect();
	});

	sendPlayerConnectedToFrontend();
	sendPlayerConnectedToMatchmaker();
});

function unsubscribeAllPlayers(streamerId) {
	console.log(`unsubscribing all players on ${streamerId}`);
	let clone = new Map(players);
	for (let player of clone.values()) {
		 if (player.streamerId == streamerId) {
		 	if (player.id == SFUPlayerId) {
		 		// because we're working on a clone here we have to access directly
				players[SFUPlayerId].streamerId = null;
			} else {
				player.ws.close();
			}
		}
	}
}

function disconnectAllPlayers(code, reason) {
	console.log("killing all players");
	let clone = new Map(players);
	for (let player of clone.values()) {
		if (player.id != SFUPlayerId) { // dont dc the sfu
			player.ws.close(code, reason);
		}
	}
}

function disconnectSFUPlayer() {
	console.log("disconnecting SFU from streamer");
	if(players.has(SFUPlayerId)) {
		players.get(SFUPlayerId).ws.close(4000, "SFU Disconnected");
		players.delete(SFUPlayerId);
	}
	sendMessageFromPlayer(SFUPlayerId, { type: 'playerDisconnected' }, true, false);
}

/**
 * Function that handles the connection to the matchmaker.
 */

if (config.UseMatchmaker) {
	var matchmaker = new net.Socket();

	matchmaker.on('connect', function() {
		console.log(`Cirrus connected to Matchmaker ${matchmakerAddress}:${matchmakerPort}`);

		// message.playerConnected is a new variable sent from the SS to help track whether or not a player 
		// is already connected when a 'connect' message is sent (i.e., reconnect). This happens when the MM
		// and the SS get disconnected unexpectedly (was happening often at scale for some reason).
		var playerConnected = false;

		// Set the playerConnected flag to tell the MM if there is already a player active (i.e., don't send a new one here)
		if( players && players.size > 0) {
			playerConnected = true;
		}

		// Add the new playerConnected flag to the message body to the MM
		message = {
			type: 'connect',
			address: typeof serverPublicIp === 'undefined' ? '127.0.0.1' : serverPublicIp,
			port: httpPort,
			ready: streamer && streamer.readyState === 1,
			playerConnected: playerConnected
		};

		matchmaker.write(JSON.stringify(message));
	});

	matchmaker.on('error', (err) => {
		console.log(`Matchmaker connection error ${JSON.stringify(err)}`);
	});

	matchmaker.on('end', () => {
		console.log('Matchmaker connection ended');
	});

	matchmaker.on('close', (hadError) => {
		console.logColor(logging.Blue, 'Setting Keep Alive to true');
        matchmaker.setKeepAlive(true, 60000); // Keeps it alive for 60 seconds
		
		console.log(`Matchmaker connection closed (hadError=${hadError})`);

		reconnect();
	});

	// Attempt to connect to the Matchmaker
	function connect() {
		matchmaker.connect(matchmakerPort, matchmakerAddress);
	}

	// Try to reconnect to the Matchmaker after a given period of time
	function reconnect() {
		console.log(`Try reconnect to Matchmaker in ${matchmakerRetryInterval} seconds`)
		setTimeout(function() {
			connect();
		}, matchmakerRetryInterval * 1000);
	}

	function registerMMKeepAlive() {
		setInterval(function() {
			message = {
				type: 'ping'
			};
			matchmaker.write(JSON.stringify(message));
		}, matchmakerKeepAliveInterval * 1000);
	}

	connect();
	registerMMKeepAlive();
}

//Keep trying to send gameSessionId in case the server isn't ready yet
function sendGameSessionData() {
	//If we are not using the frontend web server don't try and make requests to it
	if (!config.UseFrontend)
		return;
	webRequest.get(`${FRONTEND_WEBSERVER}/server/requestSessionId`,
		function (response, body) {
			if (response.statusCode === 200) {
				gameSessionId = body;
				console.log('SessionId: ' + gameSessionId);
			}
			else {
				console.error('Status code: ' + response.statusCode);
				console.error(body);
			}
		},
		function (err) {
			//Repeatedly try in cases where the connection timed out or never connected
			if (err.code === "ECONNRESET") {
				//timeout
				sendGameSessionData();
			} else if (err.code === 'ECONNREFUSED') {
				console.error('Frontend server not running, unable to setup game session');
			} else {
				console.error(err);
			}
		});
}

function sendUserSessionData(serverPort) {
	//If we are not using the frontend web server don't try and make requests to it
	if (!config.UseFrontend)
		return;
	webRequest.get(`${FRONTEND_WEBSERVER}/server/requestUserSessionId?gameSessionId=${gameSessionId}&serverPort=${serverPort}&appName=${querystring.escape(clientConfig.AppName)}&appDescription=${querystring.escape(clientConfig.AppDescription)}${(typeof serverPublicIp === 'undefined' ? '' : '&serverHost=' + serverPublicIp)}`,
		function (response, body) {
			if (response.statusCode === 410) {
				sendUserSessionData(serverPort);
			} else if (response.statusCode === 200) {
				userSessionId = body;
				console.log('UserSessionId: ' + userSessionId);
			} else {
				console.error('Status code: ' + response.statusCode);
				console.error(body);
			}
		},
		function (err) {
			//Repeatedly try in cases where the connection timed out or never connected
			if (err.code === "ECONNRESET") {
				//timeout
				sendUserSessionData(serverPort);
			} else if (err.code === 'ECONNREFUSED') {
				console.error('Frontend server not running, unable to setup user session');
			} else {
				console.error(err);
			}
		});
}

function sendServerDisconnect() {
	//If we are not using the frontend web server don't try and make requests to it
	if (!config.UseFrontend)
		return;
	try {
		webRequest.get(`${FRONTEND_WEBSERVER}/server/serverDisconnected?gameSessionId=${gameSessionId}&appName=${querystring.escape(clientConfig.AppName)}`,
			function (response, body) {
				if (response.statusCode === 200) {
					console.log('serverDisconnected acknowledged by Frontend');
				} else {
					console.error('Status code: ' + response.statusCode);
					console.error(body);
				}
			},
			function (err) {
				//Repeatedly try in cases where the connection timed out or never connected
				if (err.code === "ECONNRESET") {
					//timeout
					sendServerDisconnect();
				} else if (err.code === 'ECONNREFUSED') {
					console.error('Frontend server not running, unable to setup user session');
				} else {
					console.error(err);
				}
			});
	} catch(err) {
		console.logColor(logging.Red, `ERROR::: sendServerDisconnect error: ${err.message}`);
	}
}

function sendPlayerConnectedToFrontend() {
	//If we are not using the frontend web server don't try and make requests to it
	if (!config.UseFrontend)
		return;
	try {
		webRequest.get(`${FRONTEND_WEBSERVER}/server/clientConnected?gameSessionId=${gameSessionId}&appName=${querystring.escape(clientConfig.AppName)}`,
			function (response, body) {
				if (response.statusCode === 200) {
					console.log('clientConnected acknowledged by Frontend');
				} else {
					console.error('Status code: ' + response.statusCode);
					console.error(body);
				}
			},
			function (err) {
				//Repeatedly try in cases where the connection timed out or never connected
				if (err.code === "ECONNRESET") {
					//timeout
					sendPlayerConnectedToFrontend();
				} else if (err.code === 'ECONNREFUSED') {
					console.error('Frontend server not running, unable to setup game session');
				} else {
					console.error(err);
				}
			});
	} catch(err) {
		console.logColor(logging.Red, `ERROR::: sendPlayerConnectedToFrontend error: ${err.message}`);
	}
}

function sendPlayerDisconnectedToFrontend() {
	//If we are not using the frontend web server don't try and make requests to it
	if (!config.UseFrontend)
		return;
	try {
		webRequest.get(`${FRONTEND_WEBSERVER}/server/clientDisconnected?gameSessionId=${gameSessionId}&appName=${querystring.escape(clientConfig.AppName)}`,
			function (response, body) {
				if (response.statusCode === 200) {
					console.log('clientDisconnected acknowledged by Frontend');
				}
				else {
					console.error('Status code: ' + response.statusCode);
					console.error(body);
				}
			},
			function (err) {
				//Repeatedly try in cases where the connection timed out or never connected
				if (err.code === "ECONNRESET") {
					//timeout
					sendPlayerDisconnectedToFrontend();
				} else if (err.code === 'ECONNREFUSED') {
					console.error('Frontend server not running, unable to setup game session');
				} else {
					console.error(err);
				}
			});
	} catch(err) {
		console.logColor(logging.Red, `ERROR::: sendPlayerDisconnectedToFrontend error: ${err.message}`);
	}
}

function sendStreamerConnectedToMatchmaker() {
	if (!config.UseMatchmaker)
		return;
	try {
		message = {
			type: 'streamerConnected'
		};
		matchmaker.write(JSON.stringify(message));
	} catch (err) {
		console.logColor(logging.Red, `ERROR sending streamerConnected: ${err.message}`);
	}
}

function sendStreamerDisconnectedToMatchmaker(streamerId) {
	if (!config.UseMatchmaker)
		return;
	try {
		message = {
			type: 'streamerDisconnected'
		};
		matchmaker.write(JSON.stringify(message));	
	} catch (err) {
		console.logColor(logging.Red, `ERROR sending streamerDisconnected: ${err.message}`);
	}
}

// The Matchmaker will not re-direct clients to this Cirrus server if any client
// is connected.
function sendPlayerConnectedToMatchmaker() {
	if (!config.UseMatchmaker)
		return;
	try {
		message = {
			type: 'clientConnected'
		};
		matchmaker.write(JSON.stringify(message));
	} catch (err) {
		console.logColor(logging.Red, `ERROR sending clientConnected: ${err.message}`);
	}
}

// The Matchmaker is interested when nobody is connected to a Cirrus server
// because then it can re-direct clients to this re-cycled Cirrus server.
function sendPlayerDisconnectedToMatchmaker() {
	if (!config.UseMatchmaker)
		return;
	try {
		message = {
			type: 'clientDisconnected'
		};
		matchmaker.write(JSON.stringify(message));
	} catch (err) {
		console.logColor(logging.Red, `ERROR sending clientDisconnected: ${err.message}`);
	}
}
