const net = require('net');
const logging = require('./logging.js');

module.exports = class Matchmaker{
	socket;
	port;
	address;
	retryInterval;
	serverPublicIp;
	players;
	streamerReadyState;
	httpPort;

	constructor(matchmakerPort, matchmakerAddress, matchmakerRetryInterval, serverPublicIp, httpPort){
		this.port = matchmakerPort;
		this.address = matchmakerAddress;
		this.retryInterval = matchmakerRetryInterval;
		this.serverPublicIp = serverPublicIp;
		this.httpPort = httpPort;
		this.socket = new net.Socket();
		this.registerEvents();
	}

	registerEvents(){
		this.socket.on('connect', () => {
			console.log(`Cirrus connected to Matchmaker ${this.address}:${this.port}`);
	
			// message.playerConnected is a new variable sent from the SS to help track whether or not a player 
			// is already connected when a 'connect' message is sent (i.e., reconnect). This happens when the MM
			// and the SS get disconnected unexpectedly (was happening often at scale for some reason).
			var playerConnected = false;
	
			// Set the playerConnected flag to tell the MM if there is already a player active (i.e., don't send a new one here)
			if( this.players && this.players.size > 0) {
				playerConnected = true;
			}
	
			// Add the new playerConnected flag to the message body to the MM
			this.#sendMessage({
				type: 'connect',
				address: typeof this.serverPublicIp === 'undefined' ? '127.0.0.1' : this.serverPublicIp,
				port: this.httpPort,
				ready: this.streamerReadyState && this.streamerReadyState === 1,
				playerConnected: playerConnected
			});
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

	setPlayers(players){
		this.players = players;
	}

	setStreamerReadyState(state){
		this.streamerReadyState = state;
	}

	// Attempt to connect to the Matchmaker
	connect() {
		this.socket.connect(this.port, this.address);
	}

	// Try to reconnect to the Matchmaker after a given period of time
	reconnect() {
		console.log(`Try reconnect to Matchmaker in ${this.retryInterval} seconds`)
		setTimeout(() => {
			this.connect();
		}, this.retryInterval * 1000);
	}

	registerKeepAlive(keepAliveInterval) {
		setInterval(() => {
			this.#sendMessage({ type: 'ping' });
		}, keepAliveInterval * 1000);
	}

	sendStreamerConnected(){
		this.#sendMessage({ type: 'streamerConnected' });
	}

	sendStreamerDisconnected(){
		this.#sendMessage({ type: 'streamerDisconnected' });
	}

	// The Matchmaker will not re-direct clients to this Cirrus server if any client
	// is connected.
	sendPlayerConnected(){
		this.#sendMessage({ type: 'clientConnected' });
	}

	// The Matchmaker is interested when nobody is connected to a Cirrus server
	// because then it can re-direct clients to this re-cycled Cirrus server.
	sendPlayerDisconnected(){
		this.#sendMessage({ type: 'clientDisconnected' });
	}

	#sendMessage(message){
		try {
			this.socket.write(JSON.stringify(message));
		} catch (err) {
			console.logColor(logging.Red, `ERROR sending ${message.type}: ${err.message}`);
		}
	}
}