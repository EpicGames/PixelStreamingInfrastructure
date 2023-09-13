// Copyright Epic Games, Inc. All Rights Reserved.

import { Config, Flags, PixelStreaming } from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.4';
import { Application, PixelStreamingApplicationStyle } from '@epicgames-ps/lib-pixelstreamingfrontend-ui-ue5.4';
const PixelStreamingApplicationStyles =
    new PixelStreamingApplicationStyle();
PixelStreamingApplicationStyles.applyStyleSheet();

export class PixelStreamingFrame {
	element: HTMLElement;
	pixelStreamingApp: Application;

	constructor(element: HTMLElement, pixelStreamingApp: Application) {
		this.element = element;
		this.pixelStreamingApp = pixelStreamingApp;
	}
}

// This is the entrypoint to the stress test, all setup happens here
export class StressTester {
	play: boolean;
	maxPeers: number;
	totalStreams: number;
	streamCreationIntervalMs: number;
	streamDeletionIntervalMs: number;
	pixelStreamingFrames: Array<PixelStreamingFrame>;
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
			const inputElem = document.getElementById("creationIntervalInput") as HTMLInputElement;
			const parsedValue = Number.parseInt(inputElem.value);
			if(!Number.isNaN(parsedValue)) {
				this.streamCreationIntervalMs = parsedValue * 1000.0;
				this.startStreamCreation();
			}
		}

		document.getElementById("deletionIntervalInput").onchange = (event: Event) => {
			const inputElem = document.getElementById("deletionIntervalInput") as HTMLInputElement;
			const parsedValue = Number.parseInt(inputElem.value);
			if (!Number.isNaN(parsedValue)) {
				this.streamDeletionIntervalMs = parsedValue * 1000.0;
				this.startStreamDeletion();
			}
		}

		const creationIntervalInput = document.getElementById("creationIntervalInput") as HTMLInputElement;
		creationIntervalInput.value = (this.streamCreationIntervalMs / 1000.0).toString();

		const deletionIntervalInput = document.getElementById("deletionIntervalInput") as HTMLInputElement;
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
				const curNPeers = this.pixelStreamingFrames.length;
				if(curNPeers >= this.maxPeers) return;

				const maxPeersToCreate = this.maxPeers - curNPeers;
				const nPeersToCreate = Math.ceil(Math.random() * maxPeersToCreate);

				for(let i = 0; i < nPeersToCreate; i++) {
					const psFrame = this.createPixelStreamingFrame();
					const n = this.pixelStreamingFrames.length;
					psFrame.element.id = `PixelStreamingFrame_${n + 1}`;
					this.streamsContainer.append(psFrame.element);
					this.pixelStreamingFrames.push(psFrame);
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

			const curNPeers = this.pixelStreamingFrames.length;
			if(curNPeers === 0) return;

			const nPeersToDelete = Math.ceil(Math.random() * curNPeers);
			for(let i = 0; i < nPeersToDelete; i++) {
				const psFrame = this.pixelStreamingFrames.shift();
				// Remove HTML element from DOM
				psFrame.element.parentNode.removeChild(psFrame.element);
				// Disconnect Pixel Streaming application so we don't have orphaned WebRTC/WebSocket/PeerConnections
				psFrame.pixelStreamingApp.stream.disconnect();
			}
		}, this.streamDeletionIntervalMs);
	}

	private setupPlayPause() : void {
		const playPauseBtn = document.getElementById("playPause");
		playPauseBtn.innerHTML = this.play ? "Pause" : "Play";

		playPauseBtn.onclick = (event : Event) => {
			this.play = !this.play;
			playPauseBtn.innerHTML = this.play ? "Pause" : "Play";
		}
	}

	private createPixelStreamingFrame() : PixelStreamingFrame {
		const streamFrame = document.createElement("div");

		const config = new Config();
		config.setFlagEnabled(Flags.AutoConnect, true);
		config.setFlagEnabled(Flags.AutoPlayVideo, true);
		config.setFlagEnabled(Flags.StartVideoMuted, true);

		// Create a Native DOM delegate instance that implements the Delegate interface class
		const stream = new PixelStreaming(config);
		const application = new Application({
			stream,
			onColorModeChanged: (isLightMode : any) => PixelStreamingApplicationStyles.setColorMode(isLightMode)
		});
		streamFrame.appendChild(application.rootElement);

		return new PixelStreamingFrame(streamFrame, application);
	}

	private updateTotalStreams() : void {
		const nStreamsLabel = document.getElementById("nStreamsLabel");
		nStreamsLabel.innerHTML = this.totalStreams.toString();
	}
}

const tester = new StressTester();
tester.startStressTest();