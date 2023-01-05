import { Config } from "../Config/Config";
import { StatsPanel } from "../Ui/StatsPanel";
import { IDelegate } from "./IDelegate";
import { LatencyTestResults } from "../DataChannel/LatencyTestResults"
import { IActionOverlay } from "../Overlay/IActionOverlay";
import { IAfkOverlay } from "../Overlay/IAfkOverlay";
import { IOverlay } from "../Overlay/IOverlay";
import { ITextOverlay } from "../Overlay/ITextOverlay";
import { AggregatedStats } from "../PeerConnectionController/AggregatedStats";
import { VideoQpIndicator } from '../Ui/VideoQpIndicator'
import { SettingsPanel } from "../Ui/SettingsPanel";
import { webRtcPlayerController } from "../WebRtcPlayer/WebRtcPlayerController";
import { Flags, NumericParameters } from "../Config/Config";
import { Logger } from "../Logger/Logger";
import { InitialSettings, EncoderSettings, WebRTCSettings } from "../DataChannel/InitialSettings"
import { OnScreenKeyboard } from "../Ui/OnScreenKeyboard"
import { DisconnectOverlay, ConnectOverlay, PlayOverlay, AfkOverlay, InfoOverlay, ErrorOverlay } from "../Overlay/Overlays"
import { Controls } from "../Ui/Controls"
import { LabelledButton } from "../Ui/LabelledButton";

/**
 * Provides common base functionality for delegates that implement the IDelegate interface
*/
export class DelegateBase implements IDelegate {
	public iWebRtcController: webRtcPlayerController;
	public config: Config;

	_rootElement: HTMLElement;
	_uiFeatureElement: HTMLElement;
	_videoElementParent: HTMLElement;

	showActionOrErrorOnDisconnect = true;

	settingsPanel: SettingsPanel;
	statsPanel: StatsPanel;
	videoQpIndicator: VideoQpIndicator;
	onScreenKeyboardHelper: OnScreenKeyboard;

	// set the overlay placeholders 
	currentOverlay: IOverlay;
	disconnectOverlay: IActionOverlay;
	connectOverlay: IActionOverlay;
	playOverlay: IActionOverlay;
	afkOverlay: IAfkOverlay;
	infoOverlay: ITextOverlay;
	errorOverlay: ITextOverlay;

	videoStartTime: number;
	inputController: boolean;

	/**
	 * @param config - A newly instantiated config object  
	 * returns the base delegate object with the config inside it along with a new instance of the Overlay controller class 
	 */
	constructor(config: Config) {
		this.config = config;

		this.createOverlays();

		// Add the video stream QP indicator
		this.videoQpIndicator = new VideoQpIndicator();
		this.uiFeaturesElement.appendChild(this.videoQpIndicator.rootElement);

		// Add settings panel
		this.settingsPanel = new SettingsPanel();
		this.uiFeaturesElement.appendChild(this.settingsPanel.rootElement);
		this.configureSettings();

		// Add stats panel
		this.statsPanel = new StatsPanel();
		this.uiFeaturesElement.appendChild(this.statsPanel.rootElement);

		this.createButtons();

		// setup webrtc
		this.setIWebRtcPlayerController(new webRtcPlayerController(this.config, this));

		// Onscreen keyboard
		this.onScreenKeyboardHelper = new OnScreenKeyboard(this.videoElementParent);
		this.onScreenKeyboardHelper.unquantizeAndDenormalizeUnsigned = (x: number, y: number) => this.iWebRtcController.requestUnquantisedAndDenormaliseUnsigned(x, y);
		this.activateOnScreenKeyboard = (command: any) => this.onScreenKeyboardHelper.showOnScreenKeyboard(command);

	}

	public createOverlays() : void {
		// build all of the overlays 
		this.disconnectOverlay = new DisconnectOverlay(this.videoElementParent);
		this.connectOverlay = new ConnectOverlay(this.videoElementParent);
		this.playOverlay = new PlayOverlay(this.videoElementParent);
		this.afkOverlay = new AfkOverlay(this.videoElementParent);
		this.infoOverlay = new InfoOverlay(this.videoElementParent);
		this.errorOverlay = new ErrorOverlay(this.videoElementParent);
	}

	/**
	 * Set up button click functions and button functionality  
	 */
	public createButtons() {

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
	 * Gets the rootElement of the application, video stream and all UI are children of this element.
	 */
	public get rootElement() : HTMLElement {
		if(!this._rootElement) {
			this._rootElement = document.createElement("div");
			this._rootElement.id = "playerUI";
			this._rootElement.classList.add("noselect");
			this._rootElement.appendChild(this.videoElementParent);
			this._rootElement.appendChild(this.uiFeaturesElement);
		}
		return this._rootElement;
	}

	/**
	 * Gets the element that contains the video stream element.
	 */
	public get videoElementParent() : HTMLElement {
		if(!this._videoElementParent) {
			this._videoElementParent = document.createElement("div");
			this._videoElementParent.id = "videoElementParent";
		}
		return this._videoElementParent;
	}

	/**
	 * Gets the element that contains all the UI features, like the stats and settings panels.
	 */
	public get uiFeaturesElement() : HTMLElement {
		if(!this._uiFeatureElement) {
			this._uiFeatureElement = document.createElement("div");
			this._uiFeatureElement.id = "uiFeatures";
		}
		return this._uiFeatureElement;
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

		this.config.addOnSettingChangedListener(Flags.VideoFillParent, (shouldFillParent : boolean) => {
			this.iWebRtcController.setEnlargeToFillParent(shouldFillParent);
			this.iWebRtcController.resizePlayerStyle();
		});

		this.config.addOnSettingChangedListener(Flags.MatchViewportResolution, (shouldMatch : boolean) => {
			this.iWebRtcController.matchViewportResolution = shouldMatch;
			this.iWebRtcController.updateVideoStreamSize();
		});

		this.config.addOnSettingChangedListener(Flags.ControlScheme, (isHoveringMouse : boolean) => {
			if (isHoveringMouse) {
				this.config.setFlagLabel(Flags.ControlScheme, "Control Scheme: Hovering Mouse");
				this.config.setFlagEnabled(Flags.ControlScheme, true);
				this.iWebRtcController.activateRegisterMouse();
			} else {
				this.config.setFlagLabel(Flags.ControlScheme, "Control Scheme: Locked Mouse");
				this.config.setFlagEnabled(Flags.ControlScheme, false);
				this.iWebRtcController.activateRegisterMouse();
			}
		});

		// encoder settings
		this.config.addOnNumericSettingChangedListener(NumericParameters.MinQP, (newValue: number) => {
			Logger.Log(Logger.GetStackTrace(), "--------  Sending encoder settings  --------", 7);
			const encode: EncoderSettings = {
				MinQP: newValue,
				MaxQP: this.config.getNumericSettingValue(NumericParameters.MaxQP)
			};
			this.iWebRtcController.sendEncoderSettings(encode);
			Logger.Log(Logger.GetStackTrace(), "-------------------------------------------", 7);
		});

		this.config.addOnNumericSettingChangedListener(NumericParameters.MaxQP, (newValue: number) => {
			Logger.Log(Logger.GetStackTrace(), "--------  Sending encoder settings  --------", 7);
			const encode: EncoderSettings = {
				MinQP: this.config.getNumericSettingValue(NumericParameters.MinQP),
				MaxQP: newValue
			};
			this.iWebRtcController.sendEncoderSettings(encode);
			Logger.Log(Logger.GetStackTrace(), "-------------------------------------------", 7);
		});

		// WebRTC settings
		this.config.addOnNumericSettingChangedListener(NumericParameters.WebRTCMinBitrate, (newValue: number) => {
			Logger.Log(Logger.GetStackTrace(), "--------  Sending web rtc settings  --------", 7);
			const webRtcSettings: WebRTCSettings = {
				FPS: this.config.getNumericSettingValue(NumericParameters.WebRTCFPS),
				MinBitrate: newValue * 1000,
				MaxBitrate: this.config.getNumericSettingValue(NumericParameters.WebRTCMaxBitrate) * 1000,
			}
			this.iWebRtcController.sendWebRtcSettings(webRtcSettings);
			Logger.Log(Logger.GetStackTrace(), "-------------------------------------------", 7);
		});

		this.config.addOnNumericSettingChangedListener(NumericParameters.WebRTCMaxBitrate, (newValue: number) => {
			Logger.Log(Logger.GetStackTrace(), "--------  Sending web rtc settings  --------", 7);
			const webRtcSettings: WebRTCSettings = {
				FPS: this.config.getNumericSettingValue(NumericParameters.WebRTCFPS),
				MinBitrate: this.config.getNumericSettingValue(NumericParameters.WebRTCMinBitrate) * 1000,
				MaxBitrate: newValue * 1000,
			}
			this.iWebRtcController.sendWebRtcSettings(webRtcSettings);
			Logger.Log(Logger.GetStackTrace(), "-------------------------------------------", 7);
		});

		this.config.addOnNumericSettingChangedListener(NumericParameters.WebRTCFPS, (newValue: number) => {
			Logger.Log(Logger.GetStackTrace(), "--------  Sending web rtc settings  --------", 7);
			const webRtcSettings: WebRTCSettings = {
				FPS: newValue,
				MinBitrate: this.config.getNumericSettingValue(NumericParameters.WebRTCMinBitrate) * 1000,
				MaxBitrate: this.config.getNumericSettingValue(NumericParameters.WebRTCMaxBitrate) * 1000,
			}
			this.iWebRtcController.sendWebRtcSettings(webRtcSettings);
			Logger.Log(Logger.GetStackTrace(), "-------------------------------------------", 7);
		});
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
	 * Activate the on screen keyboard when receiving the command from the streamer
	 * @param command - the keyboard command
	 */
	activateOnScreenKeyboard(command: any): void {
		throw new Error("Method not implemented.");
	}

	/**
	 * Set the input control ownership 
	 * @param inputControlOwnership - does the user have input control ownership
	 */
	onInputControlOwnership(inputControlOwnership: boolean): void {
		this.inputController = inputControlOwnership;
	}

	/**
	 * Shows the disconnect overlay 
	 * @param updateText - the text that will be displayed in the overlay
	 */
	showDisconnectOverlay(updateText: string) {
		this.hideCurrentOverlay();
		this.updateDisconnectOverlay(updateText);
		this.disconnectOverlay.show();
		this.currentOverlay = this.disconnectOverlay;
	}

	/**
	 * Update the disconnect overlays span text 
	 * @param updateText - the new countdown number 
	 */
	updateDisconnectOverlay(updateText: string) {
		this.disconnectOverlay.update(updateText);
	}

	/**
	 * Activates the disconnect overlays action 
	 */
	onDisconnectionAction() {
		this.disconnectOverlay.activate();
	}

	/**
	 * Hides the current overlay 
	 */
	hideCurrentOverlay() {
		if (this.currentOverlay != null) {
			this.currentOverlay.hide();
			this.currentOverlay = null;
		}
	}

	/**
	 * Shows the connect overlay 
	 */
	showConnectOverlay() {
		this.hideCurrentOverlay();
		this.connectOverlay.show();
		this.currentOverlay = this.connectOverlay;
	}

	/**
	 * Shows the play overlay 
	 */
	showPlayOverlay() {
		this.hideCurrentOverlay();
		this.playOverlay.show();
		this.currentOverlay = this.playOverlay;
	}

	/**
	 * Shows the text overlay 
	 * @param text - the text that will be shown in the overlay
	 */
	showTextOverlay(text: string) {
		this.hideCurrentOverlay();
		this.infoOverlay.update(text);
		this.infoOverlay.show();
		this.currentOverlay = this.infoOverlay;
	}

	/**
	 * Shows the error overlay
	 * @param text - the text that will be shown in the overlay
	 */
	showErrorOverlay(text: string) {
		this.hideCurrentOverlay();
		this.errorOverlay.update(text);
		this.errorOverlay.show();
		this.currentOverlay = this.errorOverlay;
	}

	/**
	 * Activates the connect overlays action 
	 */
	onConnectAction() {
		this.connectOverlay.activate();
	}

	/**
	 * Activates the play overlays action 
	 */
	onPlayAction() {
		this.playOverlay.activate();
	}

	/**
	 * Shows the afk overlay 
	 * @param countDown - the countdown number for the afk countdown 
	 */
	showAfkOverlay(countDown: number) {
		this.hideCurrentOverlay();
		this.updateAfkOverlay(countDown);
		this.afkOverlay.show();
		this.currentOverlay = this.afkOverlay;
	}

	/**
	 * Update the afk overlays countdown number 
	 * @param countDown - the new countdown number 
	 */
	updateAfkOverlay(countDown: number) {
		this.afkOverlay.updateCountdown(countDown);
	}

	/**
	 * Activates the afk overlays action 
	 */
	onAfkAction() {
		this.afkOverlay.activate();
	}

	/**
	 * Instantiate the WebRTCPlayerController interface to provide WebRTCPlayerController functionality within this class and set up anything that requires it 
	 * @param iWebRtcPlayerController - a WebRtcPlayerController controller instance 
	 */
	setIWebRtcPlayerController(iWebRtcPlayerController: webRtcPlayerController) {
		this.iWebRtcController = iWebRtcPlayerController;

		this.iWebRtcController.resizePlayerStyle();

		this.disconnectOverlay.onAction(() => {
			this.onWebRtcAutoConnect();
			this.iWebRtcController.connectToSignallingSever();
		});

		// Build the webRtc connect overlay Event Listener and show the connect overlay
		this.connectOverlay.onAction(() => this.iWebRtcController.connectToSignallingSever());

		// set up the afk overlays action 
		this.afkOverlay.onAction(() => this.iWebRtcController.onAfkTriggered());

		// set up the play overlays action 
		this.playOverlay.onAction(() => {
			this.onStreamLoading();
			this.iWebRtcController.playStream();
		});

		// set up the connect overlays action
		this.showConnectOrAutoConnectOverlays();
	}

	/**
	 * Show the Connect Overlay or auto connect 
	 */
	showConnectOrAutoConnectOverlays() {
		// set up if the auto play will be used or regular click to start
		if (!this.config.enableSpsAutoConnect) {
			this.showConnectOverlay();
		} else {
			// if autoplaying show an info overlay while while waiting for the connection to begin 
			this.onWebRtcAutoConnect();
			this.iWebRtcController.connectToSignallingSever();
		}
	}

	/**
	 * Show the webRtcAutoConnect Overlay and connect
	 */
	onWebRtcAutoConnect() {
		this.showTextOverlay("Auto Connecting Now");
		this.showActionOrErrorOnDisconnect = true;
	}

	/**
	 * Set up functionality to happen when receiving a webRTC answer 
	 */
	onWebRtcSdp() {
		this.showTextOverlay("WebRTC Connection Negotiated");
	}

	/**
	 * Shows a text overlay to alert the user the stream is currently loading
	 */
	onStreamLoading() {
		// build the spinner span
		const spinnerSpan: HTMLSpanElement = document.createElement('span');
		spinnerSpan.className = "visually-hidden"
		spinnerSpan.innerHTML = "Loading..."

		// build the spinner div
		const spinnerDiv: HTMLDivElement = document.createElement('div');
		spinnerDiv.id = "loading-spinner"
		spinnerDiv.className = "spinner-border ms-2"
		spinnerDiv.setAttribute("role", "status");

		// append the spinner to the element
		spinnerDiv.appendChild(spinnerSpan);

		this.showTextOverlay("Loading Stream " + spinnerDiv.outerHTML);
	}

	/**
	 * Event fired when the video is disconnected - displays the error overlay and resets the buttons stream tools upon disconnect 
	 * @param eventString - the event text that will be shown in the overlay 
	 */
	onDisconnect(eventString: string) {
		// if we have overridden the default disconnection message, assign the new value here
		if (this.iWebRtcController.getDisconnectMessageOverride() != "" && this.iWebRtcController.getDisconnectMessageOverride() !== undefined && this.iWebRtcController.getDisconnectMessageOverride() != null) {
			eventString = this.iWebRtcController.getDisconnectMessageOverride();
			this.iWebRtcController.setDisconnectMessageOverride('');
		}

		if (this.showActionOrErrorOnDisconnect == false) {
			this.showErrorOverlay(`Disconnected: ${eventString}`);
			this.showActionOrErrorOnDisconnect = true;
		} else {
			this.showDisconnectOverlay(`Disconnected: ${eventString}  \n Click To Restart`);
		}

		// update all of the tools upon disconnect 
		this.onVideoEncoderAvgQP(0);

		// disable starting a latency check
		this.statsPanel.latencyTest.latencyTestButton.onclick = () => { 
			// do nothing
		}
	}

	/**
	 * Handles when Web Rtc is connecting 
	 */
	onWebRtcConnecting() {
		this.showTextOverlay("Starting connection to server, please wait");
	}

	/**
	 * Handles when Web Rtc has connected 
	 */
	onWebRtcConnected() {
		this.showTextOverlay("WebRTC connected, waiting for video");
	}

	/**
	 * Handles when Web Rtc fails to connect 
	 */
	onWebRtcFailed() {
		this.showErrorOverlay("Unable to setup video");
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
	 * Set up functionality to happen when receiving latency test results 
	 * @param latency - latency test results object
	 */
	onLatencyTestResult(latencyTimings: LatencyTestResults) { 
		this.statsPanel.latencyTest.handleTestResult(latencyTimings);
	}

	/**
	 * Set up functionality to happen when receiving video statistics 
	 * @param videoStats - video statistics as a aggregate stats object 
	 */
	onVideoStats(videoStats: AggregatedStats) {
		// Duration
		const runTime = new Date(Date.now() - this.videoStartTime).toISOString().substr(11, 8).toString();
		this.statsPanel.addOrUpdateStat("DurationStat", "Duration", runTime);

		// Input control?
		const controlsStreamInput = this.inputController === null ? "Not sent yet" : (this.inputController ? "true" : "false");
		this.statsPanel.addOrUpdateStat("ControlsInputStat", "Controls stream input", controlsStreamInput);

		// QP
		this.statsPanel.addOrUpdateStat("QPStat", "Video quantization parameter", this.videoQpIndicator.videoEncoderAvgQP.toString());
		
		// Grab all stats we can off the aggregated stats
		this.statsPanel.handleStats(videoStats);
	}

	/**
	 * Set up functionality to happen when calculating the average video encoder qp 
	 * @param QP - the quality number of the stream
	 */
	onVideoEncoderAvgQP(QP: number) {
		this.videoQpIndicator.updateQpTooltip(QP);
	}

	/**
	 * Set up functionality to happen when receiving and handling initial settings for the UE app 
	 * @param settings - initial UE app settings  
	 */
	onInitialSettings(settings: InitialSettings) {
		if (settings.PixelStreamingSettings) {
			const allowConsoleCommands = settings.PixelStreamingSettings.AllowPixelStreamingCommands;
			if (allowConsoleCommands === false) {
				Logger.Info(Logger.GetStackTrace(), "-AllowPixelStreamingCommands=false, sending arbitrary console commands from browser to UE is disabled.");
			}
			const disableLatencyTest = settings.PixelStreamingSettings.DisableLatencyTest;
			if (disableLatencyTest) {
				this.statsPanel.latencyTest.latencyTestButton.disabled = true;
				this.statsPanel.latencyTest.latencyTestButton.title = "Disabled by -PixelStreamingDisableLatencyTester=true";
				Logger.Info(Logger.GetStackTrace(), "-PixelStreamingDisableLatencyTester=true, requesting latency report from the the browser to UE is disabled.");
			}
		}
		if (settings.EncoderSettings) {
			this.config.setNumericSetting(NumericParameters.MinQP, settings.EncoderSettings.MinQP);
			this.config.setNumericSetting(NumericParameters.MaxQP, settings.EncoderSettings.MaxQP);
		}
		if (settings.WebRTCSettings) {
			this.config.setNumericSetting(NumericParameters.WebRTCMinBitrate, settings.WebRTCSettings.MinBitrate);
			this.config.setNumericSetting(NumericParameters.WebRTCMinBitrate, settings.WebRTCSettings.MaxBitrate);
			this.config.setNumericSetting(NumericParameters.WebRTCFPS, settings.WebRTCSettings.FPS);
		}
	}

	/**
	 * Set up functionality to happen when setting quality control ownership of a stream 
	 * @param hasQualityOwnership - does this user have quality ownership of the stream true / false
	 */
	onQualityControlOwnership(hasQualityOwnership: boolean) {
		this.config.setFlagEnabled(Flags.IsQualityController, hasQualityOwnership);
	}
}
