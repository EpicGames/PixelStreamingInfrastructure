const net = require('net');
const logging = require('./logging.js');

module.exports = class Matchmaker {
	constructor(matchmakerPort, matchmakerAddress, matchmakerRetryInterval, serverPublicIp, httpPort) {
		this.port = matchmakerPort;
		this.address = matchmakerAddress;
		this.retryInterval = matchmakerRetryInterval;
		this.serverPublicIp = serverPublicIp;
		this.httpPort = httpPort;
		this.socket = new net.Socket();
		this.registerEvents();
	}

	registerEvents() {
		this.socket.on('connect', () => {
			console.log(`Cirrus connected to Matchmaker ${this.address}:${this.port}`);

			// message.playerConnected is a new variable sent from the SS to help track whether or not a player 
			// is already connected when a 'connect' message is sent (i.e., reconnect). This happens when the MM
			// and the SS get disconnected unexpectedly (was happening often at scale for some reason).
			var playerConnected = false;

			// Set the playerConnected flag to tell the MM if there is already a player active (i.e., don't send a new one here)
			if (this.players && this.players.size > 0) {
				playerConnected = true;
			}

			// Add the new playerConnected flag to the message body to the MM
			var message = {
				type: 'connect',
				address: typeof this.serverPublicIp === 'undefined' ? '127.0.0.1' : this.serverPublicIp,
				port: this.httpPort,
				ready: this.streamerReadyState && this.streamerReadyState === 1,
				playerConnected: playerConnected
			};

			this.sendMessage(message);
		});

		this.socket.on('error', (err) => {
			console.log(`Matchmaker connection error ${JSON.stringify(err)}`);
		});

		this.socket.on('end', () => {
			console.log('Matchmaker connection ended');
		});

		this.socket.on('close', (hadError) => {
			console.logColor(logging.Blue, 'Setting Keep Alive to true');
	        this.socket.setKeepAlive(true, 60000); // Keeps it alive for 60 seconds
			console.log(`Matchmaker connection closed (hadError=${hadError})`);
			this.reconnect();
		});
	}

	setPlayers(players) {
		this.players = players;
	}

	setStreamerReadyState(state) {
		this.streamerReadyState = state;
	}

	connect() {
		this.socket.connect(this.port, this.address);
	}

	reconnect() {
		console.log(`Try reconnect to Matchmaker in ${this.retryInterval} seconds`)
		setTimeout(() => {
			this.connect();
		}, this.retryInterval * 1000);
	}

	registerKeepAlive(keepAliveInterval) {
		setInterval(() => {
			this.sendMessage({type: 'ping'});
		}, keepAliveInterval * 1000);
	}

	sendStreamerConnected() {
		this.sendMessage({ type: 'streamerConnected' });
	}

	sendStreamerDisconnected() {
		this.sendMessage({ type: 'streamerDisconnected' });
	}

	sendPlayerConnected() {
		this.sendMessage({ type: 'clientConnected' });
	}

	sendPlayerDisconnected() {
		this.sendMessage({ type: 'clientDisconnected' });
	}

	sendMessage(message) {
		try {
			this.socket.write(JSON.stringify(message));
		} catch (err) {
			console.logColor(logging.Red, `ERROR sending ${message.type}: ${err.message}`);
		}
	}
}
