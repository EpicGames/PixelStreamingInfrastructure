// Copyright Epic Games, Inc. All Rights Reserved.

import * as libfrontend from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.2';

// This is the entrypoint to the stress test, all setup happens here
export class StressTester {
	play: boolean;
	maxPeers: number;
	totalStreams: number;
	streamCreationIntervalMs: number;
	streamDeletionIntervalMs: number;
	pixelStreamingFrames: Array<HTMLElement>;
	creationIntervalHandle: NodeJS.Timer;
	deletionIntervalHandle: NodeJS.Timer;
	streamsContainer: HTMLElement;

	constructor() {
		this.play = false;
		this.maxPeers = 3;
		this.totalStreams = 0;
		this.streamCreationIntervalMs = 1000;
		this.streamDeletionIntervalMs = 4000;
		this.pixelStreamingFrames = [];
		this.creationIntervalHandle = null;
		this.deletionIntervalHandle = null;
		// Get a container to put the "Pixel Streaming" pages in.
		this.streamsContainer = document.getElementById("streamsContainer");
	}

	startStressTest() : void {
		this.setupNumPeersSlider();
		this.startStreamCreation();
		this.startStreamDeletion();
		this.setupPlayPause();

		document.getElementById("creationIntervalInput").onchange = (event : Event) => {
			let inputElem = document.getElementById("creationIntervalInput") as HTMLInputElement;
			let parsedValue = Number.parseInt(inputElem.value);
			if(!Number.isNaN(parsedValue)) {
				this.streamCreationIntervalMs = parsedValue * 1000.0;
				this.startStreamCreation();
			}
		}

		document.getElementById("deletionIntervalInput").onchange = (event: Event) => {
			let inputElem = document.getElementById("deletionIntervalInput") as HTMLInputElement;
			let parsedValue = Number.parseInt(inputElem.value);
			if (!Number.isNaN(parsedValue)) {
				this.streamDeletionIntervalMs = parsedValue * 1000.0;
				this.startStreamDeletion();
			}
		}

		let creationIntervalInput = document.getElementById("creationIntervalInput") as HTMLInputElement;
		creationIntervalInput.value = (this.streamCreationIntervalMs / 1000.0).toString();

		let deletionIntervalInput = document.getElementById("deletionIntervalInput") as HTMLInputElement;
		deletionIntervalInput.value = (this.streamDeletionIntervalMs / 1000.0).toString();
	}


	private setupNumPeersSlider() : void {
		const nPeersSlider: HTMLInputElement = document.getElementById("nPeersSlider") as HTMLInputElement;
		nPeersSlider.value = this.maxPeers.toString();

		const nPeersLabel: HTMLElement = document.getElementById("nPeerLabel");
		nPeersLabel.innerHTML = this.maxPeers.toString();

		nPeersSlider.onchange = (event: Event) => {
			const inputElem = event.target as HTMLInputElement;
			const parsedValue = Number.parseInt(inputElem.value);

			if (!Number.isNaN(parsedValue)) {
				this.maxPeers = parsedValue;
				const nPeersLabel: HTMLElement = document.getElementById("nPeerLabel");
				nPeersLabel.innerHTML = this.maxPeers.toString();
			}
		}
	}

	private startStreamCreation() : void {
		if (this.creationIntervalHandle) {
			clearInterval(this.creationIntervalHandle);
		}

		this.creationIntervalHandle = setInterval(() => {
			if(this.play) {
				let curNPeers = this.pixelStreamingFrames.length;
				if(curNPeers >= this.maxPeers) return;

				let maxPeersToCreate = this.maxPeers - curNPeers;
				let nPeersToCreate = Math.ceil(Math.random() * maxPeersToCreate);

				for(let i = 0; i < nPeersToCreate; i++) {
					let frame = this.createPixelStreamingFrame();
					let n = this.pixelStreamingFrames.length;
					frame.id = `PixelStreamingFrame_${n + 1}`;
					this.streamsContainer.append(frame);
					this.pixelStreamingFrames.push(frame);
					this.totalStreams += 1;
					this.updateTotalStreams();
				}
			}
		}, this.streamCreationIntervalMs);
	}

	private startStreamDeletion() : void {
		if(this.deletionIntervalHandle) {
			clearInterval(this.deletionIntervalHandle)
		}

		this.deletionIntervalHandle = setInterval(() => {
			if(!this.play) return;

			let curNPeers = this.pixelStreamingFrames.length;
			if(curNPeers === 0) return;

			let nPeersToDelete = Math.ceil(Math.random() * curNPeers);
			for(let i = 0; i < nPeersToDelete; i++) {
				let frame = this.pixelStreamingFrames.shift();
				frame.parentNode.removeChild(frame);
			}
		}, this.streamDeletionIntervalMs);
	}

	private setupPlayPause() : void {
		let playPauseBtn = document.getElementById("playPause");
		playPauseBtn.innerHTML = this.play ? "Pause" : "Play";

		playPauseBtn.onclick = (event : Event) => {
			this.play = !this.play;
			playPauseBtn.innerHTML = this.play ? "Pause" : "Play";
		}
	}

	private createPixelStreamingFrame() : HTMLElement {
		let streamFrame = document.createElement("div");

		let config = new libfrontend.Config();
		config.setFlagEnabled(libfrontend.Flags.AutoConnect, true);
		config.setFlagEnabled(libfrontend.Flags.AutoPlayVideo, true);
		config.setFlagEnabled(libfrontend.Flags.StartVideoMuted, true);

		// Create a Native DOM delegate instance that implements the Delegate interface class
		let application = new libfrontend.Application(config);
		streamFrame.appendChild(application.rootElement);
		return streamFrame;
	}

	private updateTotalStreams() : void {
		let nStreamsLabel = document.getElementById("nStreamsLabel");
		nStreamsLabel.innerHTML = this.totalStreams.toString();
	}
}

let tester = new StressTester();
tester.startStressTest();