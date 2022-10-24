// Copyright Epic Games, Inc. All Rights Reserved.
var enableRedirectionLinks = true;
var enableRESTAPI = true;

const defaultConfig = {
	// The port clients connect to the matchmaking service over HTTP
	HttpPort: 80,
	UseHTTPS: false,
	// The matchmaking port the signaling service connects to the matchmaker
	MatchmakerPort: 9999,

	// Log to file
	LogToFile: true
};

// Similar to the Signaling Server (SS) code, load in a config.json file for the MM parameters
const argv = require('yargs').argv;

var configFile = (typeof argv.configFile != 'undefined') ? argv.configFile.toString() : 'config.json';
console.log(`configFile ${configFile}`);
const config = require('./modules/config.js').init(configFile, defaultConfig);
console.log("Config: " + JSON.stringify(config, null, '\t'));

const express = require('express');
const bodyParser = require('body-parser');
var cors = require('cors');
const app = express();
const http = require('http').Server(app);
const fs = require('fs');
const path = require('path');
app.use('/images', express.static(path.join(__dirname, './images')))

const httpHelper = require('./modules/httpHelper.js');
const logging = require('./modules/logging.js');
logging.RegisterConsoleLogger();

if (config.LogToFile) {
	logging.RegisterFileLogger('./logs');
}

// A list of all the Cirrus server which are connected to the Matchmaker.
var cirrusServers = new Map();

//
// Parse command line.
//

if (typeof argv.HttpPort != 'undefined') {
	config.HttpPort = argv.HttpPort;
}
if (typeof argv.MatchmakerPort != 'undefined') {
	config.MatchmakerPort = argv.MatchmakerPort;
}

http.listen(config.HttpPort, () => {
    console.log('HTTP listening on *:' + config.HttpPort);
});


if (config.UseHTTPS) {
	//HTTPS certificate details
	const options = {
		key: fs.readFileSync(path.join(__dirname, './certificates/client-key.pem')),
		cert: fs.readFileSync(path.join(__dirname, './certificates/client-cert.pem'))
	};

	var https = require('https').Server(options, app);

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

	https.listen(443, function () {
		console.log('Https listening on 443');
	});
}

// No servers are available so send some simple JavaScript to the client to make
// it retry after a short period of time.
function sendRetryResponse(res) {
	res.send(`<body style="background-color:black">
	<center style="margin: 70px 0; color:white">Unfortunately, the Metaspace you are trying to visit is currently full. Retrying in <span id="countdown">15</span> seconds.</center>
	<center><img src="images/mark_white.png" class="spin" width="49" height="49" style="margin: 30px 0"/></center>
	<script>
		var countdown = document.getElementById("countdown").textContent;
		setInterval(function() {
			countdown--;
			if (countdown < 1) {
				window.location.reload(1);
			} else {
				document.getElementById("countdown").textContent = countdown;
			}
		}, 1000);
	</script>
	<style>
	@keyframes spinning {
		from { transform: rotate(0deg) }
		to { transform: rotate(360deg) }
	  }
	  .spin {
		animation-name: spinning;
		animation-duration: 1s;
		animation-iteration-count: infinite;
		animation-timing-function: linear;
	  }
	</style>
	</body>`);
}

function removeTrailingSlash(str) {
	return str.replace(/\/+$/, '');
  }

// Get a Cirrus server if there is one available which has no clients connected.
function getAvailableCirrusServer() {
	for (cirrusServer of cirrusServers.values()) {
		if (cirrusServer.numConnectedClients === 0 && cirrusServer.ready === true) {

			// Check if we had at least 10 seconds since the last redirect, avoiding the 
			// chance of redirecting 2+ users to the same SS before they click Play.
			// In other words, give the user 10 seconds to click play button the claim the server.
			if( cirrusServer.hasOwnProperty('lastRedirect')) {
				if( ((Date.now() - cirrusServer.lastRedirect) / 1000) < 10 )
					continue;
			}
			cirrusServer.lastRedirect = Date.now();

			return cirrusServer;
		}
	}
	
	console.log('WARNING: No empty Cirrus servers are available');
	return undefined;
}

// Get a Cirrus server if there is one available which has no clients connected.
function getAvailableCirrusServerCheck() {
	for (cirrusServer of cirrusServers.values()) {
		if (cirrusServer.numConnectedClients === 0 && cirrusServer.ready === true) {
			return cirrusServer;
		}
	}
	
	console.log('WARNING: No empty Cirrus servers are available');
	return undefined;
}

if(enableRESTAPI) {
	// Handle REST signalling server only request.
	app.options('/signallingserver', cors())
	app.get('/signallingserver', cors(),  (req, res) => {
		cirrusServer = getAvailableCirrusServer();
		if (cirrusServer != undefined) {
			res.json({ signallingServer: `${cirrusServer.address}:${cirrusServer.port}`});
			console.log(`Returning ${cirrusServer.address}:${cirrusServer.port}`);
		} else {
			res.json({ signallingServer: '', error: 'No signalling servers available'});
		}
	});
}

if(enableRedirectionLinks) {
	// Handle standard URL.
	app.get('/', (req, res) => {
		cirrusServer = getAvailableCirrusServer();
		if (cirrusServer != undefined) {
			let url = `${config.DisableRedirection ? "https" : "http"}://${removeTrailingSlash(cirrusServer.address)}:${cirrusServer.port}`

			// determine the public key from the http query string and pass it on
			var solanaPublicKey;
			req.url.slice(2).split('&').forEach(item => {if (item.split('=')[0].search('solanaPublicKey') == 0) solanaPublicKey = (item.split('=')[1])});
			if (solanaPublicKey) url = url + `?solanaPublicKey=${solanaPublicKey}`

			console.log("Redirect to: " + url);
			res.redirect(url);
			//console.log(req);
		} else {
			sendRetryResponse(res);
		}
	});

	// Handle URL with custom HTML.
	app.get('/custom_html/:htmlFilename', (req, res) => {
		cirrusServer = getAvailableCirrusServer();
		if (cirrusServer != undefined) {
			res.redirect(`http://${cirrusServer.address}:${cirrusServer.port}/custom_html/${req.params.htmlFilename}`);
			console.log(`Redirect to ${cirrusServer.address}:${cirrusServer.port}`);
		} else {
			sendRetryResponse(res);
		}
	});
}

// It is constant accross metaspaces
const isWindows = process.platform === "win32";

let imageFolder;

if (isWindows) {
	imageFolder = path.join("C:\\Users\\", process.env["USERNAME"], "metaspaceConfig", "PortalImages");
} else {
	// If the script is running under SUDO, findout which user has initiated the command
	imageFolder = path.join("/home", process.env["USER"] === "root" ? process.env["SUDO_USER"] : process.env["USER"], "metaspaceConfig", "PortalImages");
}
 

// Make a slide show
let portalImageArray = [];
let imagesRead = false;

function readImagesFolder(portalImageArray) {
	try {
		fs.readdirSync(imageFolder).forEach(file => {
			portalImageArray.push(path.join(imageFolder, file));
		});

		// If successfully read then make it true
		imagesRead = true;
	} catch (err) {
		console.warn("PortalImages folder was not found");
		console.warn(`ERROR : ${err}`);
	}
}

// Middleware for parsing JSON body
app.use(bodyParser.json());

app.get('/getPreviewImage', (req, res) => {
	
	if (!imagesRead) readImagesFolder(portalImageArray);
	// No avaliable images 
	if (portalImageArray.length === 0) {
		res.statusStatus(404);
		return;
	}

	// Current strategy for images is to simply cycle to next one for each request, 
	// we might want to customize this for each client or simply randomize it.
	res.sendFile(portalImageArray[0]);
});

app.get('/getMetaspaceData', (req, res) => {
	let previewImageUrl = "https://" + req.get('host') + "/getPreviewImage";

	let avaliableInstance = false;
	let cirrusServer = getAvailableCirrusServerCheck();

	if (cirrusServer !== undefined) {
		avaliableInstance = true;
	} 

	res.json({
		"data": {
		  "engine": "5.0",
		  "gatedAccess": false,
		  "isOnline": true,
		  "previewImage": previewImageUrl,
		  "availableInstance": avaliableInstance
		}	
	  });
})

// Internal communication methods between MM and UE Server
app.post('/matchmaker/getMetaspaceData', (req, res) => {
	// do url validation 
	let url;
	try {
		url = new URL(req.body.url);
	}
	catch (e) {
		console.log("ERROR: Could not parse URL.");
		res.sendStatus(400);
		return;
	}

	let options = {
		hostname: url.hostname,
		port: url.port,
		path: "/getMetaspaceData",
		method: 'GET',
		headers: {
			'Content-Type': 'application/json'
		}
	}
	
	httpHelper(options, undefined, (resIn, resInData) => {
		res.send(resInData);
	})
})

// control room for inspecting registered signalling servers
// FIXME: implement basic authentication as this is a public address
app.get('/controlroom/', (req, res) => {

	const reject = () => {
		res.setHeader("www-authenticate", "Basic");
		res.sendStatus(401);
	};

	const authorization = req.headers.authorization;

	if (!authorization) {
		return reject();
	}

	const [username, password] = Buffer.from(
			authorization.replace("Basic ", ""),
			"base64"
		)
		.toString()
		.split(":");

	if (!(username === "admin" && password === "fdsfd-423fg-2msaf")) {
		return reject();
	}

	let response = ""
	response += ("<h1>Control room</h1>")

	if (!cirrusServers) {
		response += "<p>No servers found.</p>"
		res.send(response)
		return
	}

	response += ("<p>Servers found: " + cirrusServers.size + "</p>")
	response += ("<ul>")

	for (const [connection, cirrusServer] of cirrusServers.entries()) {
		// Add additional functionality to check pinging, if more than 30 seconds, close the connection.
		if (Math.round((Date.now() - cirrusServer.lastPingReceived) / 1000) > 30) {
			disconnect(connection);
		}

		address = removeTrailingSlash(cirrusServer.address)
		// calculate how long ago we sent someone to this server if we did
		let lastRedirectSecondsPast = typeof cirrusServer.lastRedirect != 'undefined' ? Math.round((Date.now() - cirrusServer.lastRedirect) / 1000) : -1

		response += "<li>"
		response += `<a href=\"${config.DisableRedirection ? "https" : "http"}://` + address + ":" + cirrusServer.port + "\">" + address + ":" + cirrusServer.port + "</a> (" + cirrusServer.numConnectedClients + " connected clients) - ready: " + cirrusServer.ready + ""
		if (lastRedirectSecondsPast > -1) response += " - last redirect: " + lastRedirectSecondsPast + " seconds ago."
		response += "</li>"
	}

	response += ("</ul>")

	response += "<p style=\"margin: 50px 0; font-size: smaller\">Refreshing page in <span id=\"countdown\">5</span> seconds...</p>"
	response += "<script>"
		response += "var countdown = document.getElementById(\"countdown\").textContent;"
		response += "setInterval(function() {"
			response += "countdown--;"
			response += "if (countdown < 1) {"
				response += "window.location.reload(1);"
			response += "} else {"
				response += "document.getElementById(\"countdown\").textContent = countdown;"
			response += "}"
		response += "}, 1000);"
	response += "</script>"


	res.send(response)
})

//
// Connection to Cirrus.
//

const net = require('net');

function disconnect(connection) {
	console.log(`Ending connection to remote address ${connection.remoteAddress}`);
	connection.end();
}

const matchmaker = net.createServer((connection) => {
	connection.on('data', (data) => {
		try {
			message = JSON.parse(data);

			if(message)
				console.log(`Message TYPE: ${message.type}`);
		} catch(e) {
			console.log(`ERROR (${e.toString()}): Failed to parse Cirrus information from data: ${data.toString()}`);
			disconnect(connection);
			return;
		}
		if (message.type === 'connect') {
			// A Cirrus server connects to this Matchmaker server.
			cirrusServer = {
				address: message.address,
				port: message.port,
				numConnectedClients: 0,
				lastPingReceived: Date.now()
			};
			cirrusServer.ready = message.ready === true;

			// Handles disconnects between MM and SS to not add dupes with numConnectedClients = 0 and redirect users to same SS
			// Check if player is connected and doing a reconnect. message.playerConnected is a new variable sent from the SS to
			// help track whether or not a player is already connected when a 'connect' message is sent (i.e., reconnect).
			if(message.playerConnected == true) {
				cirrusServer.numConnectedClients = 1;
			}

			// Find if we already have a ciruss server address connected to (possibly a reconnect happening)
			let server = [...cirrusServers.entries()].find(([key, val]) => val.address === cirrusServer.address && val.port === cirrusServer.port);

			// if a duplicate server with the same address isn't found -- add it to the map as an available server to send users to.
			if (!server || server.size <= 0) {
				console.log(`Adding connection for ${cirrusServer.address.split(".")[0]} with playerConnected: ${message.playerConnected}`)
				cirrusServers.set(connection, cirrusServer);
            } else {
				console.log(`RECONNECT: cirrus server address ${cirrusServer.address.split(".")[0]} already found--replacing. playerConnected: ${message.playerConnected}`)
				var foundServer = cirrusServers.get(server[0]);
				
				// Make sure to retain the numConnectedClients from the last one before the reconnect to MM
				if (foundServer) {					
					cirrusServers.set(connection, cirrusServer);
					console.log(`Replacing server with original with numConn: ${cirrusServer.numConnectedClients}`);
					cirrusServers.delete(server[0]);
				} else {
					cirrusServers.set(connection, cirrusServer);
					console.log("Connection not found in Map() -- adding a new one");
				}
			}
		} else if (message.type === 'streamerConnected') {
			// The stream connects to a Cirrus server and so is ready to be used
			cirrusServer = cirrusServers.get(connection);
			if(cirrusServer) {
				cirrusServer.ready = true;
				console.log(`Cirrus server ${cirrusServer.address}:${cirrusServer.port} ready for use`);
			} else {
				disconnect(connection);
			}
		} else if (message.type === 'streamerDisconnected') {
			// The stream connects to a Cirrus server and so is ready to be used
			cirrusServer = cirrusServers.get(connection);
			if(cirrusServer) {
				cirrusServer.ready = false;
				console.log(`Cirrus server ${cirrusServer.address}:${cirrusServer.port} no longer ready for use`);
			} else {
				disconnect(connection);
			}
		} else if (message.type === 'clientConnected') {
			// A client connects to a Cirrus server.
			cirrusServer = cirrusServers.get(connection);
			if(cirrusServer) {
				cirrusServer.numConnectedClients++;
				console.log(`Client connected to Cirrus server ${cirrusServer.address}:${cirrusServer.port}`);
			} else {
				disconnect(connection);
			}
		} else if (message.type === 'clientDisconnected') {
			// A client disconnects from a Cirrus server.
			cirrusServer = cirrusServers.get(connection);
			if(cirrusServer) {
				cirrusServer.numConnectedClients--;
				console.log(`Client disconnected from Cirrus server ${cirrusServer.address}:${cirrusServer.port}`);

				// Currently greyed out because it interferes with the controlroom redirection showcase

				// if(cirrusServer.numConnectedClients === 0) {
				// 	// this make this server immediately available for a new client
				// 	cirrusServer.lastRedirect = 0;
				// }
			} else {				
				disconnect(connection);
			}
		} else if (message.type === 'ping') {
			cirrusServer = cirrusServers.get(connection);
			if(cirrusServer) {
				cirrusServer.lastPingReceived = Date.now();
			} else {				
				disconnect(connection);
			}
		} else {
			console.log('ERROR: Unknown data: ' + JSON.stringify(message));
			disconnect(connection);
		}
	});

	// A Cirrus server disconnects from this Matchmaker server.
	connection.on('error', () => {
		cirrusServer = cirrusServers.get(connection);
		if(cirrusServer) {
			cirrusServers.delete(connection);
			console.log(`Cirrus server ${cirrusServer.address}:${cirrusServer.port} disconnected from Matchmaker`);
		} else {
			console.log(`Disconnected machine that wasn't a registered cirrus server, remote address: ${connection.remoteAddress}`);
		}
	});
});

matchmaker.listen(config.MatchmakerPort, () => {
	console.log('Matchmaker listening on *:' + config.MatchmakerPort);
});
