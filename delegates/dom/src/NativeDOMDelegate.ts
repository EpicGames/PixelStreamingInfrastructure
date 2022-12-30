import * as libspsfrontend from '@tensorworks/libspsfrontend'
import { VideoQpIndicator } from './VideoQpIndicator';
import { AfkOverlay, ConnectOverlay, DisconnectOverlay, PlayOverlay, InfoOverlay, ErrorOverlay } from './Overlays';
import { FullScreenIcon } from './FullscreenIcon';
import { OnScreenKeyboard } from './OnScreenKeyboard';
import { Flags } from "@tensorworks/libspsfrontend"
import { LabelledButton} from "@tensorworks/libspsfrontend"
import { NumericParameters } from '@tensorworks/libspsfrontend';
import { SettingPanel } from '@tensorworks/libspsfrontend'

export class NativeDOMDelegate extends libspsfrontend.DelegateBase {
	config: libspsfrontend.Config;
	latencyStartTime: number;
	videoStartTime: number;
	onScreenKeyboardHelper: OnScreenKeyboard;
	inputController: boolean;

	// instantiate the WebRtcPlayerControllers interface var 
	iWebRtcController: libspsfrontend.IWebRtcPlayerController;

	// HTML Elements that are used multiple times

	// Global
	videoQpIndicator: VideoQpIndicator;

	// Settings
	settingsPanel: SettingPanel;

	// Stats
	statsPanel = document.getElementById('stats-panel') as HTMLDivElement;
	latencyTestButton = document.getElementById("btn-start-latency-test") as HTMLButtonElement;
	sendStatsToServer = document.getElementById("send-stats-tgl") as HTMLInputElement;

	constructor(config: libspsfrontend.Config) {
		super(config);

		// Add the video stream QP indicator
		this.videoQpIndicator = new VideoQpIndicator();
		document.getElementById("uiFeatures").appendChild(this.videoQpIndicator.rootElement);

		// Add the settings panel
		this.settingsPanel = new SettingPanel();
		document.getElementById("uiFeatures").appendChild(this.settingsPanel.rootElement);
		this.configureSettings();

		// Add fullscreen button to controls
		const fullScreenIcon = new FullScreenIcon(document.getElementById("playerUI"));
		document.getElementById("controls").appendChild(fullScreenIcon.rootElement);

		// build all of the overlays 
		this.disconnectOverlay = new DisconnectOverlay(this.config.videoElementParent);
		this.connectOverlay = new ConnectOverlay(this.config.videoElementParent);
		this.playOverlay = new PlayOverlay(this.config.videoElementParent);
		this.afkOverlay = new AfkOverlay(this.config.videoElementParent);
		this.infoOverlay = new InfoOverlay(this.config.videoElementParent);
		this.errorOverlay = new ErrorOverlay(this.config.videoElementParent);

		// configure all buttons 
		this.ConfigureButtons();
	}

	/**
	 * Configure the settings with on change listeners and any additonal per experience settings.
	 */
	configureSettings() : void {

		// This builds all the settings sections and flags under this `settingsContent` element.
		this.config.setupFlags(document.getElementById("settingsContent"));

		this.config.addOnSettingChangedListener(Flags.IsQualityController, (isQualityController: boolean)=>{ 
			if (!isQualityController === false) {
				this.iWebRtcController.sendRequestQualityControlOwnership();
			}
		});

		this.config.addOnSettingChangedListener(Flags.AFKDetection, (isAFKEnabled: boolean) => {
			this.iWebRtcController.setAfkEnabled(isAFKEnabled);
		});

		this.config.addOnSettingChangedListener(Flags.VideoFillWindow, (shouldFillWindow : boolean) => {
			this.iWebRtcController.setEnlargeToFillDisplay(shouldFillWindow);
			this.iWebRtcController.resizePlayerStyle();
		});

		this.config.addOnSettingChangedListener(Flags.MatchViewportResolution, (shouldMatch : boolean) => {
			this.iWebRtcController.matchViewportResolution = shouldMatch;
			this.iWebRtcController.updateVideoStreamSize();
		});

		this.config.addOnSettingChangedListener(Flags.ControlScheme, (isHoveringMouse : boolean) => {
			if (isHoveringMouse) {
				this.config.setFlagLabel(Flags.ControlScheme, "Control Scheme: Hovering Mouse");
				this.config.controlScheme = libspsfrontend.ControlSchemeType.HoveringMouse;
				this.iWebRtcController.activateRegisterMouse();
			} else {
				this.config.setFlagLabel(Flags.ControlScheme, "Control Scheme: Locked Mouse");
				this.config.controlScheme = libspsfrontend.ControlSchemeType.LockedMouse;
				this.iWebRtcController.activateRegisterMouse();
			}
		});

		// encoder settings
		this.config.addOnNumericSettingChangedListener(NumericParameters.MinQP, (newValue: number) => {
			libspsfrontend.Logger.Log(libspsfrontend.Logger.GetStackTrace(), "--------  Sending encoder settings  --------", 7);
			let encode: libspsfrontend.Encoder = {
				MinQP: newValue,
				MaxQP: this.config.getNumericSettingValue(NumericParameters.MaxQP)
			};
			this.iWebRtcController.sendEncoderSettings(encode);
			libspsfrontend.Logger.Log(libspsfrontend.Logger.GetStackTrace(), "-------------------------------------------", 7);
		});

		this.config.addOnNumericSettingChangedListener(NumericParameters.MaxQP, (newValue: number) => {
			libspsfrontend.Logger.Log(libspsfrontend.Logger.GetStackTrace(), "--------  Sending encoder settings  --------", 7);
			let encode: libspsfrontend.Encoder = {
				MinQP: this.config.getNumericSettingValue(NumericParameters.MinQP),
				MaxQP: newValue
			};
			this.iWebRtcController.sendEncoderSettings(encode);
			libspsfrontend.Logger.Log(libspsfrontend.Logger.GetStackTrace(), "-------------------------------------------", 7);
		});

		// WebRTC settings
		this.config.addOnNumericSettingChangedListener(NumericParameters.WebRTCMinBitrate, (newValue: number) => {
			libspsfrontend.Logger.Log(libspsfrontend.Logger.GetStackTrace(), "--------  Sending web rtc settings  --------", 7);
			let webRtcSettings: libspsfrontend.WebRTC = {
				FPS: this.config.getNumericSettingValue(NumericParameters.WebRTCFPS),
				MinBitrate: newValue * 1000,
				MaxBitrate: this.config.getNumericSettingValue(NumericParameters.WebRTCMaxBitrate) * 1000,
			}
			this.iWebRtcController.sendWebRtcSettings(webRtcSettings);
			libspsfrontend.Logger.Log(libspsfrontend.Logger.GetStackTrace(), "-------------------------------------------", 7);
		});

		this.config.addOnNumericSettingChangedListener(NumericParameters.WebRTCMaxBitrate, (newValue: number) => {
			libspsfrontend.Logger.Log(libspsfrontend.Logger.GetStackTrace(), "--------  Sending web rtc settings  --------", 7);
			let webRtcSettings: libspsfrontend.WebRTC = {
				FPS: this.config.getNumericSettingValue(NumericParameters.WebRTCFPS),
				MinBitrate: this.config.getNumericSettingValue(NumericParameters.WebRTCMinBitrate) * 1000,
				MaxBitrate: newValue * 1000,
			}
			this.iWebRtcController.sendWebRtcSettings(webRtcSettings);
			libspsfrontend.Logger.Log(libspsfrontend.Logger.GetStackTrace(), "-------------------------------------------", 7);
		});

		this.config.addOnNumericSettingChangedListener(NumericParameters.WebRTCFPS, (newValue: number) => {
			libspsfrontend.Logger.Log(libspsfrontend.Logger.GetStackTrace(), "--------  Sending web rtc settings  --------", 7);
			let webRtcSettings: libspsfrontend.WebRTC = {
				FPS: newValue,
				MinBitrate: this.config.getNumericSettingValue(NumericParameters.WebRTCMinBitrate) * 1000,
				MaxBitrate: this.config.getNumericSettingValue(NumericParameters.WebRTCMaxBitrate) * 1000,
			}
			this.iWebRtcController.sendWebRtcSettings(webRtcSettings);
			libspsfrontend.Logger.Log(libspsfrontend.Logger.GetStackTrace(), "-------------------------------------------", 7);
		});

	}

	/**
	 * Set the input control ownership 
	 * @param inputControlOwnership does the user have input control ownership
	 */
	onInputControlOwnership(inputControlOwnership: boolean): void {
		this.inputController = inputControlOwnership;
	}

	/**
	 * Instantiate the WebRTCPlayerController interface to provide WebRTCPlayerController functionality within this class and set up anything that requires it 
	 * @param iWebRtcPlayerController 
	 */
	setIWebRtcPlayerController(iWebRtcPlayerController: libspsfrontend.IWebRtcPlayerController) {
		// do base class stuff first
		super.setIWebRtcPlayerController(iWebRtcPlayerController);

		// set up the on screen keyboard
		this.onScreenKeyboardHelper = new OnScreenKeyboard(this.config.videoElementParent);
		this.onScreenKeyboardHelper.unquantizeAndDenormalizeUnsigned = (x: number, y: number) => this.iWebRtcController.requestUnquantisedAndDenormaliseUnsigned(x, y);
		this.activateOnScreenKeyboard = (command: any) => this.onScreenKeyboardHelper.showOnScreenKeyboard(command);
	}

	/**
	 * Shows a text overlay to alert the user the stream is currently loading
	 */
	onStreamLoading() {
		// build the spinner span
		var spinnerSpan: HTMLSpanElement = document.createElement('span');
		spinnerSpan.className = "visually-hidden"
		spinnerSpan.innerHTML = "Loading..."

		// build the spinner div
		var spinnerDiv: HTMLDivElement = document.createElement('div');
		spinnerDiv.id = "loading-spinner"
		spinnerDiv.className = "spinner-border ms-2"
		spinnerDiv.setAttribute("role", "status");

		// append the spinner to the element
		spinnerDiv.appendChild(spinnerSpan);

		this.showTextOverlay("Loading Stream " + spinnerDiv.outerHTML);
	}

	/**
	* Set up functionality to happen when an instance state change occurs and updates the info overlay with the response
	* @param instanceState - the message instance state 
	*/
	onInstanceStateChange(instanceState: libspsfrontend.MessageInstanceState) {
		let instanceStateMessage = "";
		let isInstancePending = false;
		let isError = false;

		// get the response type
		switch (instanceState.state) {
			case libspsfrontend.InstanceState.UNALLOCATED:
				instanceStateMessage = "Instance Unallocated: " + instanceState.details;
				break;
			case libspsfrontend.InstanceState.FAILED:
				instanceStateMessage = "UE Instance Failed: " + instanceState.details;
				isError = true;
				break;
			case libspsfrontend.InstanceState.PENDING:
				isInstancePending = true;
				if (instanceState.details == undefined || instanceState.details == null) {
					instanceStateMessage = "Your application is pending";
				} else {
					instanceStateMessage = instanceState.details;
				}
				break;
			case libspsfrontend.InstanceState.READY:
				if (instanceState.details == undefined || instanceState.details == null) {
					instanceStateMessage = "Instance is Ready";

				} else {
					instanceStateMessage = "Instance is Ready: " + instanceState.details;
				}
				break;
			default:
				instanceStateMessage = "Unhandled Instance State" + instanceState.state + " " + instanceState.details;
				break;
		}

		if (isError) {
			this.showErrorOverlay(instanceStateMessage);
		} else if (isInstancePending) {

			//check if there is already and instance pending if so return 
			let preExistingPendingMessage = document.getElementById('loading-spinner') as HTMLDivElement;
			if (preExistingPendingMessage) {

				// only update our text div
				let textDiv = document.getElementById("text-"+instanceState.id) as HTMLSpanElement;
				textDiv.innerHTML = instanceStateMessage;
				return;
			}

			// build a wrapper to hold our text and our spinner
			var wrapperDiv: HTMLDivElement = document.createElement('div');

			// build a text div to hold our text message
			var textSpan: HTMLSpanElement = document.createElement('span');
			textSpan.id = "text-" + instanceState.id
			textSpan.innerHTML = instanceStateMessage;

			// build the spinner span
			var spinnerSpan: HTMLSpanElement = document.createElement('span');
			spinnerSpan.className = "visually-hidden"
			spinnerSpan.innerHTML = "Loading..."

			// build the spinner div
			var spinnerDiv: HTMLDivElement = document.createElement('div');
			spinnerDiv.id = "loading-spinner"
			spinnerDiv.className = "spinner-border ms-2"
			spinnerDiv.setAttribute("role", "status");

			// append wrapper and the spinner to the element
			wrapperDiv.appendChild(textSpan);
			wrapperDiv.appendChild(spinnerDiv).appendChild(spinnerSpan);

			// insert the inner html into the base div
			this.showTextOverlay(wrapperDiv.outerHTML);
		} else {
			this.showTextOverlay(instanceStateMessage);
		}
	}

	/**
	 * Set up functionality to happen when receiving an auth response and updates an info overlay with the response
	 * @param authResponse - the auth response message type
	 */
	onAuthenticationResponse(authResponse: libspsfrontend.MessageAuthResponse) {
		let instanceStateMessage = "";
		let isError = false;

		// get the response type
		switch (authResponse.outcome) {
			case libspsfrontend.MessageAuthResponseOutcomeType.AUTHENTICATED:
				instanceStateMessage = "Authentication has succeeded. Requesting Instance";
				break;
			case libspsfrontend.MessageAuthResponseOutcomeType.INVALID_TOKEN:
				instanceStateMessage = "Invalid Token: " + authResponse.error;
				isError = true;
				break;
			case libspsfrontend.MessageAuthResponseOutcomeType.REDIRECT:
				instanceStateMessage = "Redirecting to: " + authResponse.redirect;
				break;
			case libspsfrontend.MessageAuthResponseOutcomeType.ERROR:
				instanceStateMessage = "Error: " + authResponse.error;
				isError = true;
				break;
			default:
				instanceStateMessage = "Unhandled Auth Response: " + authResponse.outcome;
				break;
		}

		// if the response is an error show the error instead of the info 
		if (isError) {
			this.showErrorOverlay(instanceStateMessage);
		} else {
			this.showTextOverlay(instanceStateMessage);
		}
	}

	/**
	 * Set up button click functions and button functionality  
	 */
	ConfigureButtons() {

		// set up the settings 
		document.getElementById('settingsBtn').onclick = () => this.settingsClicked();
		document.getElementById('settingsClose').onclick = () => this.settingsClicked();

		// setup the info button
		document.getElementById('statsBtn').onclick = () => this.statsClicked();
		document.getElementById('statsClose').onclick = () => this.statsClicked();

		const settingsElem = document.getElementById("settingsContent");
		const commandsSectionElem = this.config.buildSectionWithHeading(settingsElem, "Commands");
		
		// Add button for toggle fps
		const showFPSButton = new LabelledButton("Show FPS", "Toggle");
		showFPSButton.addOnClickListener(()=>{
			this.iWebRtcController.sendShowFps();
		});

		// Add button for restart stream
		const restartStreamButton = new LabelledButton("Restart Stream", "Restart");
		restartStreamButton.addOnClickListener(()=>{
			this.iWebRtcController.restartStreamAutomaticity();
		});

		// Add button for request keyframe
		const requestKeyframeButton = new LabelledButton("Request keyframe", "Request");
		requestKeyframeButton.addOnClickListener(()=>{
			this.iWebRtcController.requestKeyFrame();
		});

		commandsSectionElem.appendChild(showFPSButton.rootElement);
		commandsSectionElem.appendChild(requestKeyframeButton.rootElement);
		commandsSectionElem.appendChild(restartStreamButton.rootElement);

	}

	/**
	 * Shows or hides the settings panel if clicked
	 */
	settingsClicked() {
		/**
		 * Toggle settings panel. If stats panel is already open, close it and then open settings
		 */
		if (this.statsPanel.classList.contains("panel-wrap-visible")) {
			this.statsPanel.classList.toggle("panel-wrap-visible");
		}

		this.settingsPanel.toggleVisibility();
	}

	/**
	 * Shows or hides the stats panel if clicked
	 */
	statsClicked() {
		/**
		 * Toggle stats panel. If settings panel is already open, close it and then open stats
		 */
		this.settingsPanel.hide();
		this.statsPanel.classList.toggle("panel-wrap-visible");
	}

	/**
	 * Disable shared session links for all players
	 * @returns false
	 */
	async IsLinkSharingEnabled() {
		return false;
	}

	/**
	 * Handle when the Video has been Initialised
	 */
	onVideoInitialised() {
		// starting a latency check
		this.latencyTestButton.onclick = () => {
			this.iWebRtcController.sendLatencyTest();
		}

		this.videoStartTime = Date.now();
	}

	/**
	 * Extended from the base functionality; displays the error overlay and resets the buttons stream tools upon disconnect 
	 * @param eventText 
	 */
	onDisconnect(eventText: string) {
		// display the text overlay by calling its super method so it will use its default behavior first 
		super.onDisconnect(`${eventText}`);

		// update all of the tools upon disconnect 
		this.onVideoEncoderAvgQP(0);

		// disable starting a latency check
		this.latencyTestButton.onclick = () => { }
	}

	/**
	 * Takes the InitialSettings and wired to frontend
	 * @param settings - Settings sent from the UE Instance
	 */
	onInitialSettings(settings: libspsfrontend.InitialSettings): void {
		if (settings.PixelStreaming) {
			let allowConsoleCommands = settings.PixelStreaming.AllowPixelStreamingCommands;
			if (allowConsoleCommands === false) {
				libspsfrontend.Logger.Info(libspsfrontend.Logger.GetStackTrace(), "-AllowPixelStreamingCommands=false, sending arbitrary console commands from browser to UE is disabled.");
			}
			let disableLatencyTest = settings.PixelStreaming.DisableLatencyTest;
			if (disableLatencyTest) {
				this.latencyTestButton.disabled = true;
				this.latencyTestButton.title = "Disabled by -PixelStreamingDisableLatencyTester=true";
				libspsfrontend.Logger.Info(libspsfrontend.Logger.GetStackTrace(), "-PixelStreamingDisableLatencyTester=true, requesting latency report from the the browser to UE is disabled.");
			}
		}
		if (settings.Encoder) {
			this.config.setNumericSetting(NumericParameters.MinQP, settings.Encoder.MinQP);
			this.config.setNumericSetting(NumericParameters.MaxQP, settings.Encoder.MaxQP);
		}
		if (settings.WebRTC) {
			this.config.setNumericSetting(NumericParameters.WebRTCMinBitrate, settings.WebRTC.MinBitrate);
			this.config.setNumericSetting(NumericParameters.WebRTCMinBitrate, settings.WebRTC.MaxBitrate);
			this.config.setNumericSetting(NumericParameters.WebRTCFPS, settings.WebRTC.FPS);
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

		// format numbering based on the browser language
		let numberFormat = new Intl.NumberFormat(window.navigator.language, {
			maximumFractionDigits: 0
		});

		// ensure that we have a currentRoundTripTime coming in from stats and format it if it's a number
		let netRTT = stats.candidatePair.hasOwnProperty('currentRoundTripTime') && stats.isNumber(stats.candidatePair.currentRoundTripTime) ? numberFormat.format(stats.candidatePair.currentRoundTripTime * 1000) : 'Can\'t calculate';

		statsText += `<div>Duration: ${runTime}</div>`;
		statsText += `<div>Controls stream input: ${this.inputController === null ? "Not sent yet" : (this.inputController ? "true" : "false")}</div>`;
		statsText += `<div>Received: ${inboundData}</div>`;
		statsText += `<div>Packets Lost: ${stats.inboundVideoStats.packetsLost}</div>`;
		statsText += `<div>Bitrate (kbps): ${stats.inboundVideoStats.bitrate}</div>`;
		statsText += `<div>Video Resolution: ${stats.inboundVideoStats.hasOwnProperty('frameWidth') && stats.inboundVideoStats.frameWidth && stats.inboundVideoStats.hasOwnProperty('frameHeight') && stats.inboundVideoStats.frameHeight ?
			stats.inboundVideoStats.frameWidth + 'x' + stats.inboundVideoStats.frameHeight : 'Chrome only'
			}</div>`;
		statsText += `<div>Frames Decoded: ${stats.inboundVideoStats.hasOwnProperty('framesDecoded') ? numberFormat.format(stats.inboundVideoStats.framesDecoded) : 'Chrome only'}</div>`;
		statsText += `<div>Packets Lost: ${stats.inboundVideoStats.hasOwnProperty('packetsLost') ? numberFormat.format(stats.inboundVideoStats.packetsLost) : 'Chrome only'}</div>`;
		statsText += `<div>Framerate: ${stats.inboundVideoStats.framerate}</div>`;
		statsText += `<div>Frames dropped: ${stats.inboundVideoStats.framesDropped}</div>`;
		statsText += `<div>Net RTT (ms): ${netRTT}</div>`;
		//statsText += `<div>Browser receive to composite (ms): ${stats.inboundVideoStats.receiveToCompositeMs}</div>`;
		statsText += `<div>Video Quantization Parameter: ${this.videoQpIndicator.videoEncoderAvgQP}</div>`;

		let statsDiv = document.getElementById("statisticsResult");
		statsDiv.innerHTML = statsText;

		libspsfrontend.Logger.Log(libspsfrontend.Logger.GetStackTrace(), `--------- Stats ---------\n ${stats}\n------------------------`, 6);

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
		libspsfrontend.Logger.Log(libspsfrontend.Logger.GetStackTrace(), latencyTimings.toString(), 6);
		let latencyStatsInnerHTML = '';
		latencyStatsInnerHTML += "<div>Net latency RTT (ms): " + latencyTimings.networkLatency + "</div>";
		latencyStatsInnerHTML += "<div>UE Encode (ms): " + latencyTimings.EncodeMs + "</div>";
		latencyStatsInnerHTML += "<div>UE Capture (ms): " + latencyTimings.CaptureToSendMs + "</div>";
		latencyStatsInnerHTML += "<div>Browser send latency (ms): " + latencyTimings.browserSendLatency + "</div>";
		latencyStatsInnerHTML += latencyTimings.frameDisplayDeltaTimeMs && latencyTimings.browserReceiptTimeMs ? "<div>Browser receive latency (ms): " + latencyTimings.frameDisplayDeltaTimeMs + "</div>" : "";
		latencyStatsInnerHTML += "<div>Total latency (excluding browser) (ms): " + latencyTimings.latencyExcludingDecode + "</div>";
		latencyStatsInnerHTML += latencyTimings.endToEndLatency ? "<div>Total latency (ms): " + latencyTimings.endToEndLatency + "</div>" : "";

		document.getElementById("latencyStatsResults").innerHTML = latencyStatsInnerHTML;
	}

	/**
	 * Handles when the ownership flag is sent from the signaling server
	 * @param hasQualityOwnership - flag if the user has quality ownership
	 */
	onQualityControlOwnership(hasQualityOwnership: boolean): void {
		this.config.setFlagEnabled(Flags.IsQualityController, hasQualityOwnership);
	}

	/**
	  * Calls updateQpTooltip to update the QP colour light
	  * @param QP - The video encoder QP number needed to find the average
	  */
	onVideoEncoderAvgQP(QP: number): void {
		this.videoQpIndicator.updateQpTooltip(QP);
	}
}