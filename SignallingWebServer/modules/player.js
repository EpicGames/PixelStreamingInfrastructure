const Logger = require('./logger.js');

module.exports = class Player {
	static Type = { Regular: 0, SFU: 1 };

	constructor(id, ws, type, browserSendOffer, streamerMap, logger) {
		this.id = id;
		this.ws = ws;
		this.type = type;
		this.browserSendOffer = browserSendOffer;
		this.streamerMap = streamerMap;
		this.logger = logger;
	}

	subscribe(streamerId) {
		if (!this.streamerMap.has(streamerId)) {
			console.error(`subscribe: Player ${this.id} tried to subscribe to a non-existent streamer ${streamerId}`);
			return;
		}
		this.streamerId = streamerId;
		const msg = { type: 'playerConnected', playerId: this.id, dataChannel: true, sfu: this.type == Player.Type.SFU, sendOffer: !this.browserSendOffer };
		this.logger.logOutgoing(this.streamerId, msg);
		this.sendFrom(msg);
	}

	unsubscribe() {
		if (this.streamerId && this.streamerMap.has(this.streamerId)) {
			const msg = { type: 'playerDisconnected', playerId: this.id };
			this.logger.logOutgoing(this.streamerId, msg);
			this.sendFrom(msg);
		}
		this.streamerId = null;
	}

	sendFrom(message) {
		if (!this.streamerId) {
			if(this.streamerMap.size > 0) {
				this.streamerId = this.streamerMap.entries().next().value[0];
				console.logColor(logging.Orange, `Player ${this.id} attempted to send an outgoing message without having subscribed first. Defaulting to ${this.streamerId}`);
			} else {
				console.logColor(logging.Orange, `Player ${this.id} attempted to send an outgoing message without having subscribed first. No streamer connected so this message isn't going anywhere!`)
				return;
			}
		}

		// normally we want to indicate what player this message came from
		// but in some instances we might already have set this (streamerDataChannels) due to poor choices
		if (!message.playerId) {
			message.playerId = this.id;
		}
		const msgString = JSON.stringify(message);

		let streamer = this.streamerMap.get(this.streamerId);
		if (!streamer) {
			console.error(`sendFrom: Player ${this.id} subscribed to non-existent streamer: ${this.streamerId}`);
		} else {
			streamer.ws.send(msgString);
		}
	}

	sendTo(message) {
		const msgString = JSON.stringify(message);
		this.ws.send(msgString);
	}
};
