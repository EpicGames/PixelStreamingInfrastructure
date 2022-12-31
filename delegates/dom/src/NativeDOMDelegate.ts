import * as libspsfrontend from '@tensorworks/libspsfrontend'
import { VideoQpIndicator } from './VideoQpIndicator';
import { AfkOverlay, ConnectOverlay, DisconnectOverlay, PlayOverlay, InfoOverlay, ErrorOverlay } from './Overlays';
import { OnScreenKeyboard } from './OnScreenKeyboard';
import { Flags } from "@tensorworks/libspsfrontend"
import { LabelledButton} from "@tensorworks/libspsfrontend"
import { NumericParameters } from '@tensorworks/libspsfrontend';
import { SettingPanel } from '@tensorworks/libspsfrontend'
import { StatsPanel } from '@tensorworks/libspsfrontend'
import { Controls } from './Controls';

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
	statsPanel: StatsPanel;

	constructor(config: libspsfrontend.Config) {
		super(config);

		// Add the video stream QP indicator
		this.videoQpIndicator = new VideoQpIndicator();
		this.uiFeaturesElement.appendChild(this.videoQpIndicator.rootElement);

		// Add the settings panel
		this.settingsPanel = new SettingPanel();
		this.uiFeaturesElement.appendChild(this.settingsPanel.rootElement);
		this.configureSettings();

		// Add stats/info panel
		this.statsPanel = new StatsPanel();
		this.uiFeaturesElement.appendChild(this.statsPanel.rootElement);

		// build all of the overlays 
		this.disconnectOverlay = new DisconnectOverlay(this.videoElementParent);
		this.connectOverlay = new ConnectOverlay(this.videoElementParent);
		this.playOverlay = new PlayOverlay(this.videoElementParent);
		this.afkOverlay = new AfkOverlay(this.videoElementParent);
		this.infoOverlay = new InfoOverlay(this.videoElementParent);
		this.errorOverlay = new ErrorOverlay(this.videoElementParent);

		// configure all buttons 
		this.ConfigureButtons();

		// setup webrtc
		this.setIWebRtcPlayerController(new libspsfrontend.webRtcPlayerController(this.config, this));
	}

	/**
	 * Configure the settings with on change listeners and any additonal per experience settings.
	 */
	configureSettings() : void {

		// This builds all the settings sections and flags under this `settingsContent` element.
		this.config.setupFlags(this.settingsPanel.settingsContentElement);

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
		this.onScreenKeyboardHelper = new OnScreenKeyboard(this.videoElementParent);
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

		// Setup controls
		const controls = new Controls();

		// When we fullscreen we want this element to be the root
		controls.fullscreenIcon.fullscreenElement = this.rootElement;
		this.uiFeaturesElement.appendChild(controls.rootElement);

		// Add settings button to controls
		controls.settingsIcon.rootElement.onclick = () => this.settingsClicked();
		this.settingsPanel.settingsCloseButton.onclick = () => this.settingsClicked();

		// setup the stats/info button
		controls.statsIcon.rootElement.onclick = () => this.statsClicked();
		
		this.statsPanel.statsCloseButton.onclick = () => this.statsClicked();

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

		const commandsSectionElem = this.config.buildSectionWithHeading(this.settingsPanel.settingsContentElement, "Commands");
		commandsSectionElem.appendChild(showFPSButton.rootElement);
		commandsSectionElem.appendChild(requestKeyframeButton.rootElement);
		commandsSectionElem.appendChild(restartStreamButton.rootElement);

	}

	/**
	 * Shows or hides the settings panel if clicked
	 */
	settingsClicked() {
		this.statsPanel.hide();
		this.settingsPanel.toggleVisibility();
	}

	/**
	 * Shows or hides the stats panel if clicked
	 */
	statsClicked() {
		this.settingsPanel.hide();
		this.statsPanel.toggleVisibility();
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
		this.statsPanel.latencyTest.latencyTestButton.onclick = () => {
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
		this.statsPanel.latencyTest.latencyTestButton.onclick = () => { }
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
				this.statsPanel.latencyTest.latencyTestButton.disabled = true;
				this.statsPanel.latencyTest.latencyTestButton.title = "Disabled by -PixelStreamingDisableLatencyTester=true";
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
		
		// Duration
		const runTime = new Date(Date.now() - this.videoStartTime).toISOString().substr(11, 8).toString();
		this.statsPanel.addOrUpdateStat("DurationStat", "Duration", runTime);

		// Input control?
		const controlsStreamInput = this.inputController === null ? "Not sent yet" : (this.inputController ? "true" : "false");
		this.statsPanel.addOrUpdateStat("ControlsInputStat", "Controls stream input", controlsStreamInput);

		// QP
		this.statsPanel.addOrUpdateStat("QPStat", "Video quantization parameter", this.videoQpIndicator.videoEncoderAvgQP.toString());
		
		// Grab all stats we can off the aggregated stats
		this.statsPanel.handleStats(stats);

		if (this.statsPanel.sendToServerCheckbox.checked === true) {
			this.iWebRtcController.sendStatsToSignallingServer(stats);
		}
	}

	/**
	* Handles the result of the UE Latency Test
	* @param latencyTimings - Latency Test Timings sent from the UE Instance 
	*/
	onLatencyTestResult(latencyTimings: libspsfrontend.LatencyTestResults): void {
		this.statsPanel.latencyTest.handleTestResult(latencyTimings);
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