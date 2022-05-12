import './assets/css/player.css';
import 'bootstrap/dist/css/bootstrap.min.css'
import * as libspsfrontend from '@tensorworks/libspsfrontend'

export class NativeDOMDelegate extends libspsfrontend.DelegateBase {
	config: libspsfrontend.Config;
	latencyStartTime: number;
	videoStartTime: number;
	videoEncoderAvgQP: number;

	//instantiate the WebRtcPlayerControllers interface var 
	iWebRtcController: libspsfrontend.IWebRtcPlayerController;

	//instantiate the connect overlay click event listener
	connectOverlayEvent: EventListener;

	//instantiate the AFK Overlay Controller and click event listener
	AfkLogic: libspsfrontend.AfkLogic
	afkOverlayEvent: EventListener;

	showStats: boolean;

	logging: boolean;

	// HTML Elements that are used multiple times

	//Global
	statusLight = document.getElementById("qualityStatus") as HTMLDivElement;

	//Pre Stream options
	forceTurnToggle = document.getElementById("force-turn-tgl") as HTMLInputElement;

	//Viewing
	qualityControlOwnershipCheckBox = document.getElementById("quality-control-ownership-tgl") as HTMLInputElement;
	toggleMatchViewPortRes = document.getElementById("match-viewport-res-tgl") as HTMLInputElement;
	controlSchemeToggle = document.getElementById("control-scheme-tgl") as HTMLInputElement;
	controlSchemeToggleTitle = document.getElementById("control-scheme-title") as HTMLDivElement;

	//Commands
	uiDescriptorText = document.getElementById("ui-descriptor-text") as HTMLInputElement;

	//Settings
	encoderMinQpText = document.getElementById("encoder-min-qp-text") as HTMLInputElement;
	encoderMaxQpText = document.getElementById("encoder-max-qp-text") as HTMLInputElement;
	webRtcFpsText = document.getElementById("webrtc-fps-text") as HTMLInputElement;
	webRtcMinBitrateText = document.getElementById("webrtc-min-bitrate-text") as HTMLInputElement;
	webRtcMaxBitrateText = document.getElementById("webrtc-max-bitrate-text") as HTMLInputElement;

	//Statistics
	sendStatsToServer = document.getElementById("send-stats-tgl") as HTMLInputElement;

	//Containers Headers
	preStreamContainer = document.getElementById("preStreamOptionsHeader") as HTMLDivElement;
	viewSettingsHeader = document.getElementById("viewSettingsHeader") as HTMLDivElement;
	commandsHeader = document.getElementById("commandsHeader") as HTMLDivElement;
	streamingSettingsHeader = document.getElementById("streamingSettingsHeader") as HTMLDivElement;
	statsHeader = document.getElementById("statisticsHeader") as HTMLDivElement;
	latencyHeader = document.getElementById("latencyTestHeader") as HTMLDivElement;

	//Containers
	viewSettingsContainer = document.getElementById("viewSettingsContainer") as HTMLDivElement;
	commandsContainer = document.getElementById("commandsContainer") as HTMLDivElement;
	streamingSettingsContainer = document.getElementById("streamingSettingsContainer") as HTMLDivElement;
	statsContainer = document.getElementById("statisticsContainer") as HTMLDivElement;
	latencyContainer = document.getElementById("latencyTestContainer") as HTMLDivElement;

	constructor(config: libspsfrontend.Config) {
		super(config);
		this.showStats = true;
		this.logging = false;
		this.videoEncoderAvgQP = -1;
		this.AfkLogic = new libspsfrontend.AfkLogic(this.config.controlScheme, this.config.enableAfk);

		// Build the AFK overlay Event Listener
		this.afkOverlayEvent = () => {
			// The user clicked so start the timer again and carry on.
			this.Overlay.hideOverlay();
			clearInterval(this.AfkLogic.afk.countdownTimer);
			this.AfkLogic.startAfkWarningTimer();
		}

		// Set the AFK overlay by invoking setOverlay from the overlay Controller
		this.AfkLogic.afkSetOverlay = () => this.Overlay.setOverlay('clickableState', this.AfkLogic.afk.overlay, this.afkOverlayEvent);

		// Hide the AFK Overlay by invoking hideOverlay from the overlay Controller
		this.AfkLogic.afkHideOverlay = () => this.Overlay.hideOverlay();

		// give the webRtcPlayerController the ability to start the afk inactivity watcher
		this.startAfkWatch = () => this.AfkLogic.startAfkWarningTimer();

		// give the webRtcPlayerController the ability to reset the afk inactivity watcher
		this.resetAfkWatch = () => this.AfkLogic.resetAfkWarningTimer();

		this.ConfigureButtons();
	}

	/**
	 * Set up button click functions and button functionality  
	 */
	ConfigureButtons() {
		// setup the Force TURN toggle
		this.setUpToggleWithUrlParams(this.forceTurnToggle, "ForceTURN");

		this.setUpControlSchemeTypeToggle(this.controlSchemeToggle);

		// set up the restart stream button
		document.getElementById("restart-stream-button").onclick = () => {
			this.iWebRtcController.restartStreamAutomaticity();
		}

		document.getElementById("btn-streaming-settings").onclick = () => {
			console.debug("--------  Sending Streaming settings  --------");
			let encode: libspsfrontend.Encoder = {
				MinQP: Number(this.encoderMinQpText.value),
				MaxQP: Number(this.encoderMaxQpText.value),
			}

			let webRtcSettings: libspsfrontend.WebRTC = {
				FPS: Number(this.webRtcFpsText.value),
				MinBitrate: Number(this.webRtcMinBitrateText.value) * 1000,
				MaxBitrate: Number(this.webRtcMaxBitrateText.value) * 1000,
			}

			this.iWebRtcController.sendEncoderSettings(encode);
			this.iWebRtcController.sendWebRtcSettings(webRtcSettings);
			console.debug("-------------------------------------------");
		}


		// sending UI descriptors 
		document.getElementById("sendUiDescriptor").onclick = () => {
			this.iWebRtcController.sendUeUiDescriptor(this.uiDescriptorText.value);

		};

		// show the current fps on screen 
		document.getElementById("show-fps-button").onclick = () => {
			this.iWebRtcController.sendShowFps();
		};

		// make the player fill the window
		document.getElementById("enlarge-display-to-fill-window-tgl").onchange = () => {
			this.iWebRtcController.resizePlayerStyle();
		};

		// make the player match the view port resolution 
		this.toggleMatchViewPortRes.onchange = () => {
			this.iWebRtcController.matchViewportResolution = this.toggleMatchViewPortRes.checked
		};

		// quality control ownership checkbox 
		this.qualityControlOwnershipCheckBox.onchange = () => {
			if (this.qualityControlOwnershipCheckBox.checked === false) {
				this.iWebRtcController.sendRequestQualityControlOwnership();
			}
		};

		// show and hide the optional buttons overlay 
		document.getElementById("overlayButton").onclick = () => {
			document.getElementById("overlaySettings").classList.toggle("d-none");
		}


	}

	/**
	 * Set up toggle element for controlling hovering mouse or locked mouse  
	 * @param toggleElement the toggle html element to be set up
	 */
	setUpControlSchemeTypeToggle(toggleElement: HTMLInputElement) {
		if (toggleElement) {

			// set the state for the toggle based on the config
			if (this.config.controlScheme === libspsfrontend.ControlSchemeType.LockedMouse) {
				this.controlSchemeToggleTitle.innerHTML = "Control Scheme: Locked Mouse"
				this.controlSchemeToggle.checked = false;
			} else {
				this.controlSchemeToggleTitle.innerHTML = "Control Scheme: Hovering Mouse"
				this.controlSchemeToggle.checked = true;
			}

			// set the onChange event 
			toggleElement.onchange = () => {
				if (toggleElement.checked === true) {
					this.controlSchemeToggleTitle.innerHTML = "Control Scheme: Hovering Mouse"
					this.config.controlScheme = libspsfrontend.ControlSchemeType.HoveringMouse;
					this.iWebRtcController.activateRegisterMouse();
				} else {
					this.controlSchemeToggleTitle.innerHTML = "Control Scheme: Locked Mouse"
					this.config.controlScheme = libspsfrontend.ControlSchemeType.LockedMouse;
					this.iWebRtcController.activateRegisterMouse();
				}
			};
		}
	}

	/**
	 * Set up url toggle buttons
	 * @param toggleElement the toggle element being activated  
	 * @param urlParameterKey the url key that is being made use of
	 */
	setUpToggleWithUrlParams(toggleElement: HTMLInputElement, urlParameterKey: string) {
		if (toggleElement) {
			//Check if the element has been set from the URL Params 
			toggleElement.checked = new URLSearchParams(window.location.search).has(urlParameterKey);

			toggleElement.onchange = () => {
				const urlParams = new URLSearchParams(window.location.search);
				if (toggleElement.checked === true) {
					urlParams.set(urlParameterKey, "true");
				} else {
					urlParams.delete(urlParameterKey);
				}
				window.history.replaceState({}, '', urlParams.toString() !== "" ? `${location.pathname}?${urlParams}` : `${location.pathname}`);
			};
		}
	}

	/**
	 * Disable shared session links for all players
	 * @returns false
	 */
	async IsLinkSharingEnabled() {
		return false;
	}

	/**
	* Finnish setting up all things that require the WebRtcPlayerController
	*/
	setIWebRtcPlayerController(iWebRtcPlayerController: libspsfrontend.IWebRtcPlayerController) {
		this.iWebRtcController = iWebRtcPlayerController;

		//set up Ui's for start up 
		this.iWebRtcController.FreezeFrameLogic.IOverlay = this.Overlay;
		this.iWebRtcController.FreezeFrameLogic.invalidateFreezeFrameOverlay();
		this.iWebRtcController.resizePlayerStyle();

		// set up if the auto play will be used or regular click to start
		if (this.config.enableSpsAutoplay === false) {
			// Build the connect overlay Event Listener and show the connect overlay
			this.connectOverlayEvent = () => {
				this.iWebRtcController.connectToSignallingSever();
			}
			this.Overlay.showConnectOverlay(this.connectOverlayEvent);
		} else {
			this.iWebRtcController.connectToSignallingSever();
		}
	}

	/**
	 * Handle when the Video has been Initialised
	 */
	onVideoInitialised() {
		// starting a latency check
		document.getElementById("btn-start-latency-test").onclick = () => {
			this.iWebRtcController.sendLatencyTest();
		}

		// Set up overlay header functionality
		this.viewSettingsHeader.onclick = () => {
			this.viewSettingsContainer.classList.contains("d-none") ? this.viewSettingsContainer.classList.remove("d-none") : this.viewSettingsContainer.classList.add("d-none")
		}

		this.commandsHeader.onclick = () => {
			this.commandsContainer.classList.contains("d-none") ? this.commandsContainer.classList.remove("d-none") : this.commandsContainer.classList.add("d-none")
		}

		this.streamingSettingsHeader.onclick = () => {
			this.streamingSettingsContainer.classList.contains("d-none") ? this.streamingSettingsContainer.classList.remove("d-none") : this.streamingSettingsContainer.classList.add("d-none")
		}
		this.statsHeader.onclick = () => {
			this.statsContainer.classList.contains("d-none") ? this.statsContainer.classList.remove("d-none") : this.statsContainer.classList.add("d-none")
		}
		this.latencyHeader.onclick = () => {
			this.latencyContainer.classList.contains("d-none") ? this.latencyContainer.classList.remove("d-none") : this.latencyContainer.classList.add("d-none")
		}

		// Reveal all the container
		this.viewSettingsContainer.classList.remove("d-none");
		this.commandsContainer.classList.remove("d-none");
		this.streamingSettingsContainer.classList.remove("d-none");
		this.statsContainer.classList.remove("d-none");

		this.videoStartTime = Date.now();
	}

	/**
	 * Extended from the base functionality; displays the text overlay and resets the buttons overlay upon disconnect 
	 * @param event 
	 */
	onDisconnect(event: CloseEvent) {
		// display the text overlay
		this.Overlay.showTextOverlay(`Disconnected: ${event.code} -  ${event.reason}`);

		this.onVideoEncoderAvgQP(-1);
		// starting a latency check
		document.getElementById("btn-start-latency-test").onclick = () => { }

		// Set up overlay header functionality
		this.viewSettingsHeader.onclick = () => { }
		this.commandsHeader.onclick = () => { }
		this.streamingSettingsHeader.onclick = () => { }
		this.statsHeader.onclick = () => { }
		this.latencyHeader.onclick = () => { }

		// Hide all the containers
		this.viewSettingsContainer.classList.add("d-none");
		this.commandsContainer.classList.add("d-none");
		this.streamingSettingsContainer.classList.add("d-none");
		this.statsContainer.classList.add("d-none");
	}

	/**
	 * `Takes the InitialSettings and wired to frontend
	 * @param settings - Settings sent from the UE Instance`
	 */
	onInitialSettings(settings: libspsfrontend.InitialSettings): void {
		if (settings.Encoder) {
			this.encoderMinQpText.value = settings.Encoder.MinQP.toString();
			this.encoderMaxQpText.value = settings.Encoder.MaxQP.toString();
		}
		if (settings.WebRTC) {
			this.webRtcMinBitrateText.value = settings.WebRTC.MinBitrate.toString();
			this.webRtcMaxBitrateText.value = settings.WebRTC.MaxBitrate.toString();
			this.webRtcFpsText.value = settings.WebRTC.FPS.toString();
		}
	}

	/**
	* Used to handle the Video Stats from the Peer Connection Client
	* @param stats - Stats generate from the Peer Connection Client
	*/
	onVideoStats(stats: libspsfrontend.AggregatedStats): void {
		let runTime = new Date(Date.now() - this.videoStartTime).toISOString().substr(11, 8);
		let statsText = "";
		let inboundData = this.formatBytes(stats.inboundVideoStats.bytesReceived, 2);

		statsText += `<div>Duration: ${runTime}</div>`;
		statsText += `<div>Inbound Video Data Received: ${inboundData}</div>`;
		statsText += `<div>Packets Lost: ${stats.inboundVideoStats.packetsLost}</div>`;
		statsText += `<div>Bitrate (kbps): ${stats.inboundVideoStats.bitrate}</div>`;
		statsText += `<div>Framerate: ${stats.inboundVideoStats.framerate}</div>`;
		statsText += `<div>Frames dropped: ${stats.inboundVideoStats.framesDropped}</div>`;
		statsText += `<div>Net RTT (ms): ${stats.candidatePair.currentRoundTripTime}</div>`;
		statsText += `<div>Browser receive to composite (ms): ${stats.inboundVideoStats.receiveToCompositeMs}</div>`;
		statsText += `<div>Video Quantization Parameter: ${this.videoEncoderAvgQP}</div>`;

		//document.getElementById("statsTitle").style.display = "";
		let statsDiv = document.getElementById("statisticsResult");
		statsDiv.innerHTML = statsText;

		if (this.logging) { libspsfrontend.Logger.verboseLog(`--------- Stats ---------\n ${stats}\n------------------------`) }

		if (this.sendStatsToServer.checked === true) {
			this.iWebRtcController.sendStatsToSignallingServer(stats);
		}
	}

	/**
	* formats Bytes coming in for video stats
	* @param bytes number to convert
	* @param decimals number of decimal places
	*/
	formatBytes(bytes: number, decimals: number): string {
		if (bytes === 0) {
			return "0";
		}

		const factor: number = 1024;
		const dm = decimals < 0 ? 0 : decimals;
		const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];

		const i = Math.floor(Math.log(bytes) / Math.log(factor));

		return parseFloat((bytes / Math.pow(factor, i)).toFixed(dm)) + ' ' + sizes[i];
	}

	/**
	* Handles the result of the UE Latency Test
	* @param latencyTimings - Latency Test Timings sent from the UE Instance 
	*/
	onLatencyTestResult(latencyTimings: libspsfrontend.LatencyTestResults): void {
		console.log(latencyTimings);
		let latencyStatsInnerHTML = '';
		latencyStatsInnerHTML += "<div>Net latency RTT (ms): " + latencyTimings.networkLatency + "</div>";
		latencyStatsInnerHTML += "<div>UE Encode (ms): " + latencyTimings.EncodeMs + "</div>";
		latencyStatsInnerHTML += "<div>UE Capture (ms): " + latencyTimings.CaptureToSendMs + "</div>";
		latencyStatsInnerHTML += "<div>Browser send latency (ms): " + latencyTimings.browserSendLatency + "</div>";
		latencyStatsInnerHTML += latencyTimings.frameDisplayDeltaTimeMs && latencyTimings.browserReceiptTimeMs ? "<div>Browser receive latency (ms): " + latencyTimings.frameDisplayDeltaTimeMs + "</div>" : "";
		latencyStatsInnerHTML += "<div>Total latency (excluding browser) (ms): " + latencyTimings.latencyExcludingDecode + "</div>";
		latencyStatsInnerHTML += latencyTimings.endToEndLatency ? "<div>Total latency (ms): " + latencyTimings.endToEndLatency + "</div>" : "";

		this.latencyContainer.classList.remove("d-none")

		document.getElementById("latencyStatsResults").innerHTML = latencyStatsInnerHTML;
	}

	/**
	  * 
	  * converts the Video Encoder QP to a colour light
	  * @param QP - The video encoder QP number needed to find the average
	  */
	onVideoEncoderAvgQP(QP: number): void {
		this.videoEncoderAvgQP = QP;
		this.statusLight.style.color = QualityColour.None;
		this.statusLight.title = "QP: " + QP;

		if (QP > QualityThresholds.Bad) {
			this.statusLight.style.color = QualityColour.Bad;
			this.statusLight.title += " - Bad";
			this.BlinkVideoQualityStatus(2);
		} else if (QP > QualityThresholds.Spotty) {
			this.statusLight.style.color = QualityColour.Spotty;
			this.statusLight.title += " - Spotty";
			this.BlinkVideoQualityStatus(1);
		} else if (QP < 0) {
			this.statusLight.style.color = QualityColour.None;
			this.statusLight.title += " - Error";
			console.error("Video Encoder QP can not be less then 0");
		} else {
			this.statusLight.title += " - Good";
			this.statusLight.style.color = QualityColour.Good;
		}
	}

	/**
	 * Handles when the ownership flag is sent from the signaling server
	 * @param hasQualityOwnership - flag if the user has quality ownership
	 */
	onQualityControlOwnership(hasQualityOwnership: boolean): void {
		this.qualityControlOwnershipCheckBox.checked = hasQualityOwnership;
	}

	/**
	 * Handles when there is a instance state changes
	 * @param instanceState - Instance State
	 */
	onInstanceStateChange(instanceState: libspsfrontend.MessageInstanceState): void {
		switch (instanceState.state) {
			case libspsfrontend.InstanceState.UNALLOCATED:
				this.Overlay.showTextOverlay("Instance Unallocated: " + instanceState.details);
				break;
			case libspsfrontend.InstanceState.PENDING:
				this.Overlay.showTextOverlay(instanceState.details, instanceState.progress);
				break;
			case libspsfrontend.InstanceState.FAILED:
				this.Overlay.showTextOverlay("UE Instance Failed: " + instanceState.details);
				break;
			case libspsfrontend.InstanceState.READY:
				this.Overlay.showTextOverlay("Instance is Ready: " + instanceState.details, 100);
				break;
			default:
				this.Overlay.showTextOverlay("Unhandled Instance State");
				break;
		}
	}

	/**
	 * Show an overlay when an Authentication response is received
	 * @param authResponse - Authentication response 
	 */
	onAuthenticationResponse(authResponse: libspsfrontend.MessageAuthResponse): void {
		switch (authResponse.outcome) {
			case libspsfrontend.MessageAuthResponseOutcomeType.AUTHENTICATED:
				this.Overlay.showTextOverlay("Authentication has succeeded. Requesting Instance");
				break;
			case libspsfrontend.MessageAuthResponseOutcomeType.INVALID_TOKEN:
				this.Overlay.showTextOverlay("Invalid Token: " + authResponse.error);
				break;
			case libspsfrontend.MessageAuthResponseOutcomeType.REDIRECT:
				this.Overlay.showTextOverlay("Redirecting to: " + authResponse.redirect);
				break;
			case libspsfrontend.MessageAuthResponseOutcomeType.ERROR:
				this.Overlay.showTextOverlay("Error: " + authResponse.error);
				break;
			default:
				this.Overlay.showTextOverlay("Unhandled Auth Response: " + authResponse.outcome);
				break;
		}
	}

	/**
	 * Show an overlay when an RTC Answer has been received
	 */
	onWebRtcAnswer(): void {
		this.Overlay.showTextOverlay("RTC Answer", 100);
	}

	/**
	 * used to set the speed of the status light
	 * 
	 * @param speed - Set the speed of the blink if the status light higher the speed the faster the blink
	 */
	BlinkVideoQualityStatus(speed: number) {
		let iteration = speed;
		let opacity = 1;
		let tickID = setInterval(() => {
			opacity -= 0.1;
			this.statusLight.style.opacity = String(Math.abs((opacity - 0.5) * 2));
			if (opacity <= 0.1) {
				if (--iteration == 0) {
					clearInterval(tickID);
				} else {
					opacity = 1;
				}
			}
		}, 100 / speed);
	}
}

/**
 * Used for Setting the colour of the Status Light
 */
enum QualityColour {
	Good = "lime",
	Spotty = "orange",
	Bad = "red",
	None = "black"
}

/**
 * Used to set the Quality Thresholds of the Video Encoder QP
 */
enum QualityThresholds {
	Spotty = 26,
	Bad = 35,
}


/**
 * The static check to allow verbose logging
 */
export class LoggingOptions {
	static verboseLogging = false;
}
