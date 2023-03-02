const Logger = require('./logger.js');

module.exports = class Player {
	constructor(id, ws, type, browserSendOffer, config) {
		this.id = id;
		this.ws = ws;
		this.type = type;
		this.browserSendOffer = browserSendOffer;
		this.logger = new Logger(config);
	}

	subscribe(streamers, streamerId) {
		if (!streamers.has(streamerId)) {
			console.error(`subscribe: Player ${this.id} tried to subscribe to a non-existent streamer ${streamerId}`);
			return;
		}
		this.streamerId = streamerId;
		const msg = { type: 'playerConnected', playerId: this.id, dataChannel: true, sfu: this.type == PlayerType.SFU, sendOffer: !this.browserSendOffer };
		logOutgoing(this.streamerId, msg);
		this.sendFrom(msg);
	}

	unsubscribe(streamers) {
		if (this.streamerId && streamers.has(this.streamerId)) {
			const msg = { type: 'playerDisconnected', playerId: this.id };
			logOutgoing(this.streamerId, msg);
			this.sendFrom(msg);
		}
		this.streamerId = null;
	}

	sendFrom(message) {
		if (!this.streamerId) {
			return;
		}

		message.playerId = this.id;
		const msgString = JSON.stringify(message);

		let streamer = streamers.get(this.streamerId);
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