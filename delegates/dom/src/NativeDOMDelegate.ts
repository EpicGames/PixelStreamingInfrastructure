import './assets/css/player.css';
import 'bootstrap/dist/css/bootstrap.min.css'
import { EventEmitter } from "events";
import * as libspsfrontend from '@tensorworks/libspsfrontend'

/**
 * Class for the base overlay structure 
 */
export class OverlayBase implements libspsfrontend.IOverlay {
	protected rootElement: HTMLDivElement;
	protected rootDiv: HTMLDivElement;
	public textElement: HTMLDivElement;

	/**
	 * Construct an overlay 
	 * @param rootDiv the root element this overlay will be inserted into 
	 * @param rootElement the root element that is the overlay
	 */
	protected constructor(rootDiv: HTMLDivElement, rootElement: HTMLDivElement, textElement: HTMLDivElement) {
		this.rootDiv = rootDiv;
		this.rootElement = rootElement;
		this.textElement = textElement;
		this.rootElement.appendChild(this.textElement);
		this.hide();
		this.rootDiv.appendChild(this.rootElement);
	}

	/**
	 * Show the overlay 
	 */
	public show(): void {
		this.rootElement.classList.remove("hiddenState");
	}

	/**
	 * Hide the overlay
	 */
	public hide(): void {
		this.rootElement.classList.add("hiddenState");
	}
}

/**
 * Class for the base action overlay structure 
 */
export class ActionOverlayBase extends OverlayBase implements libspsfrontend.IActionOverlay {
	eventEmitter: EventEmitter;
	contentElementSpanId: string;

	/**
	 * Construct an action overlay 
	 * @param rootDiv the root element this overlay will be inserted into 
	 * @param rootElement the root element that is the overlay
	 * @param contentElement an element that contains text for the action overlay 
	 */
	public constructor(rootDiv: HTMLDivElement, rootElement: HTMLDivElement, contentElement: HTMLDivElement, contentElementSpandId?: string) {
		super(rootDiv, rootElement, contentElement);
		this.eventEmitter = new EventEmitter();
		this.contentElementSpanId = contentElementSpandId;
	}

	/**
	 * Update the text overlays inner text 
	 * @param text the update text to be inserted into the overlay 
	 */
	public update(text: string): void {
		if ((text != null || text != undefined) && (this.contentElementSpanId != null || this.contentElementSpanId != undefined)) {
			document.getElementById(this.contentElementSpanId).innerHTML = text;
		}
	}

	/**
	 * Set a method as an event emitter callback 
	 * @param callBack the method that is to be called when the event is emitted 
	 */
	onAction(callBack: (...args: any[]) => void) {
		this.eventEmitter.on("action", callBack);
	}

	/**
	 * Activate an event that is attached to the event emitter 
	 */
	activate() {
		this.eventEmitter.emit("action");
	}

}

/**
 * Class for the afk overlay base 
 */
export class AfkOverlayBase extends ActionOverlayBase implements libspsfrontend.IAfkOverlay {
	private countDownSpanElementId: string;

	/**
	 * Construct an Afk overlay 
	 * @param rootDiv the root element this overlay will be inserted into 
	 * @param rootElement the root element that is the overlay
	 * @param textElement an element that contains text for the action overlay  
	 * @param countDownSpanElementId the id of the span that holds the countdown element 
	 */
	public constructor(rootDiv: HTMLDivElement, rootElement: HTMLDivElement, textElement: HTMLDivElement, countDownSpanElementId: string) {
		super(rootDiv, rootElement, textElement);
		this.countDownSpanElementId = countDownSpanElementId;
	}

	/**
	 * Update the count down spans number for the overlay 
	 * @param countdown the count down number to be inserted into the span for updating
	 */
	public updateCountdown(countdown: number): void {
		document.getElementById(this.countDownSpanElementId).innerHTML = countdown.toString();
	}

}

/**
 * Class for the text overlay base 
 */
export class TextOverlayBase extends OverlayBase implements libspsfrontend.ITextOverlay {

	/**
	 * Construct a text overlay 
	 * @param rootDiv the root element this overlay will be inserted into 
	 * @param rootElement the root element that is the overlay
	 * @param textElement an element that contains text for the action overlay  
	 */
	public constructor(rootDiv: HTMLDivElement, rootElement: HTMLDivElement, textElement: HTMLDivElement) {
		super(rootDiv, rootElement, textElement);
	}

	/**
	 * Update the text overlays inner text 
	 * @param text the update text to be inserted into the overlay 
	 */
	public update(text: string): void {
		if (text != null || text != undefined) {
			this.textElement.innerHTML = text;
		}
	}
}

/**
 * Class for the VideoQp indicator
 */
export class VideoQpIndicator {

	// the icon itself
	qualityStatus: SVGElement; // = document.getElementById("connectionStrength");

	// the text that displays under the icon
	qualityText: HTMLSpanElement; // = document.getElementById("qualityText");

	// svg paths
	outer: any; //= document.getElementById("outer");
	middle: any; //= document.getElementById("middle");
	inner: any; // = document.getElementById("inner");
	dot: any; // = document.getElementById("dot");

	// non html elements 
	statsText: string = "";
	color: string = "";

	// qp colours 
	readonly orangeQP = 26;
	readonly redQP = 35;

	/**
	 * construct a VideoQpIndicator object
	 * @param qualityStatusId the html id of the qualityStatus element
	 * @param qualityTextId the html id of the qualityText element
	 * @param outerId the html id of the outer element
	 * @param middleId the html id of the middle element
	 * @param innerId the html id of the inner element
	 * @param dotId the html id of the dot element
	 */
	constructor(qualityStatusId: string, qualityTextId: string, outerId: string, middleId: string, innerId: string, dotId: string) {
		this.qualityStatus = document.getElementById(qualityStatusId) as any;
		this.qualityText = document.getElementById(qualityTextId) as any;
		this.outer = document.getElementById(outerId) as any;
		this.middle = document.getElementById(middleId) as any;
		this.inner = document.getElementById(innerId) as any;
		this.dot = document.getElementById(dotId) as any;
	}

	/**
	 * used to set the speed of the status light
	 * @param speed - Set the speed of the blink if the status light higher the speed the faster the blink
	 */
	blinkVideoQualityStatus(speed: number) {
		let iteration = speed;
		let opacity = 1;
		let tickID = setInterval(() => {
			opacity -= 0.1;
			this.qualityText.style.opacity = String(Math.abs((opacity - 0.5) * 2));
			if (opacity <= 0.1) {
				if (--iteration == 0) {
					clearInterval(tickID);
				} else {
					opacity = 1;
				}
			}
		}, 100 / speed);
	}

	/**
	  * updates the QP tooltip by converting the Video Encoder QP to a colour light
	  * @param QP - The video encoder QP number needed to find the average
	  */
	updateQpTooltip(QP: number) {
		if (QP > this.redQP) {
			this.color = "red";
			this.blinkVideoQualityStatus(2);
			this.statsText = `<div style="color: ${this.color}">Poor encoding quality</div>`;
			this.outer.style.fill = "#3c3b40";
			this.middle.style.fill = "#3c3b40";
			this.inner.style.fill = this.color;
			this.dot.style.fill = this.color;
		} else if (QP > this.orangeQP) {
			this.color = "orange";
			this.blinkVideoQualityStatus(1);
			this.statsText = `<div style="color: ${this.color}">Blocky encoding quality</div>`;
			this.outer.style.fill = "#3c3b40";
			this.middle.style.fill = this.color;
			this.inner.style.fill = this.color;
			this.dot.style.fill = this.color;
		} else if (QP <= 0) {
			this.color = "#b0b0b0";
			this.outer.style.fill = "#3c3b40";
			this.middle.style.fill = "#3c3b40";
			this.inner.style.fill = "#3c3b40";
			this.dot.style.fill = "#3c3b40";
			this.statsText = `<div style="color: ${this.color}">Not connected</div>`;
		} else {
			this.color = "lime";
			this.qualityStatus.style.opacity = '1';
			this.statsText = `<div style="color: ${this.color}">Clear encoding quality</div>`;
			this.outer.style.fill = this.color;
			this.middle.style.fill = this.color;
			this.inner.style.fill = this.color;
			this.dot.style.fill = this.color;
		}
		this.qualityText.innerHTML = this.statsText;
	}

}

export class NativeDOMDelegate extends libspsfrontend.DelegateBase {
	config: libspsfrontend.Config;
	latencyStartTime: number;
	videoStartTime: number;
	videoEncoderAvgQP: number;

	// instantiate the WebRtcPlayerControllers interface var 
	iWebRtcController: libspsfrontend.IWebRtcPlayerController;

	showStats: boolean;

	logging: boolean;

	// HTML Elements that are used multiple times

	// Global
	//statusLight = document.getElementById("qualityStatus") as HTMLDivElement;
	videoQpIndicator: VideoQpIndicator;

	// Pre Stream options
	forceTurnToggle = document.getElementById("force-turn-tgl") as HTMLInputElement;

	// Viewing
	enlargeDisplayToFillWindow = document.getElementById("enlarge-display-to-fill-window-tgl") as HTMLInputElement;
	qualityControlOwnershipCheckBox = document.getElementById("quality-control-ownership-tgl") as HTMLInputElement;
	toggleMatchViewPortRes = document.getElementById("match-viewport-res-tgl") as HTMLInputElement;
	controlSchemeToggle = document.getElementById("control-scheme-tgl") as HTMLInputElement;
	controlSchemeToggleTitle = document.getElementById("control-scheme-title") as HTMLDivElement;

	// Commands
	uiDescriptorText = document.getElementById("ui-descriptor-text") as HTMLInputElement;

	// Settings
	encoderMinQpText = document.getElementById("encoder-min-qp-text") as HTMLInputElement;
	encoderMaxQpText = document.getElementById("encoder-max-qp-text") as HTMLInputElement;
	webRtcFpsText = document.getElementById("webrtc-fps-text") as HTMLInputElement;
	webRtcMinBitrateText = document.getElementById("webrtc-min-bitrate-text") as HTMLInputElement;
	webRtcMaxBitrateText = document.getElementById("webrtc-max-bitrate-text") as HTMLInputElement;

	// Statistics
	sendStatsToServer = document.getElementById("send-stats-tgl") as HTMLInputElement;

	// Containers Headers
	preStreamContainer = document.getElementById("preStreamOptionsHeader") as HTMLDivElement;
	viewSettingsHeader = document.getElementById("viewSettingsHeader") as HTMLDivElement;
	commandsHeader = document.getElementById("commandsHeader") as HTMLDivElement;
	streamingSettingsHeader = document.getElementById("streamingSettingsHeader") as HTMLDivElement;
	statsHeader = document.getElementById("statisticsHeader") as HTMLDivElement;
	latencyHeader = document.getElementById("latencyTestHeader") as HTMLDivElement;

	// Containers
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
		this.videoQpIndicator = new VideoQpIndicator("connectionStrength", "qualityText", "outer", "middle", "inner", "dot");

		// build all of the overlays 
		this.buildDisconnectOverlay();
		this.buildConnectOverlay();
		this.buildPlayOverlay();
		this.buildAfkOverlay();
		this.buildInfoOverlay();
		this.buildErrorOverlay();

		// configure all buttons 
		this.ConfigureButtons();
	}

	/**
	 * Builds the disconnect overlay 
	 */
	buildDisconnectOverlay() {
		// build the overlay base div 
		let disconnectOverlayHtml = document.createElement('div');
		disconnectOverlayHtml.id = "disconnectOverlay";
		disconnectOverlayHtml.className = "clickableState";

		// set the event Listener
		let disconnectOverlayEvent: EventListener = () => this.onDisconnectionAction();

		// add the new event listener 
		disconnectOverlayHtml.addEventListener('click', function onOverlayClick(event: Event) {
			disconnectOverlayEvent(event);
		});

		// build the inner html container 
		let disconnectOverlayHtmlInnerContainer = document.createElement('div');
		disconnectOverlayHtmlInnerContainer.id = 'disconnectButton';

		// build the span that holds error text
		let disconnectOverlayInnerSpan = document.createElement('span');
		disconnectOverlayInnerSpan.id = 'disconnectText';
		disconnectOverlayInnerSpan.innerHTML = 'Click To Restart';

		// build the image element that holds the reconnect element
		let restartSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		restartSvg.setAttribute('width', "40");
		restartSvg.setAttribute('height', "40");
		restartSvg.setAttribute('fill', "currentColor");
		restartSvg.setAttribute('class', "bi bi-arrow-counterclockwise m-2");
		restartSvg.setAttribute('viewBox', "0 0 16 16");

		// build the arrow path 
		let restartSvgPathArrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		restartSvgPathArrow.setAttribute('fill-rule', "evenodd");
		restartSvgPathArrow.setAttribute('d', "M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2v1z");
		
		// build the circle path
		let restartSvgPathCircle = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		restartSvgPathCircle.setAttribute('d', "M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466z");

		// bring it all together
		restartSvg.appendChild(restartSvgPathArrow);
		restartSvg.appendChild(restartSvgPathCircle);

		// append the span and images to the content container 
		disconnectOverlayHtmlInnerContainer.appendChild(disconnectOverlayInnerSpan);
		disconnectOverlayHtmlInnerContainer.appendChild(restartSvg);

		// instantiate the overlay
		this.disconnectOverlay = new ActionOverlayBase(this.config.playerElement, disconnectOverlayHtml, disconnectOverlayHtmlInnerContainer, "disconnectText");
	}

	/**
	 * Builds the connect overlay 
	 */
	buildConnectOverlay() {
		// build the overlay base div 
		let connectOverlayHtml = document.createElement('div');
		connectOverlayHtml.id = "connectOverlay";
		connectOverlayHtml.className = "clickableState";

		// set the event Listener
		let connectOverlayEvent: EventListener = () => this.onConnectAction();

		// add the new event listener 
		connectOverlayHtml.addEventListener('click', function onOverlayClick(event: Event) {
			connectOverlayEvent(event);
		});

		// build the inner html 
		let connectOverlayHtmlInner = document.createElement('div');
		connectOverlayHtmlInner.id = 'connectButton';
		connectOverlayHtmlInner.innerHTML = 'Click to start';

		// instantiate the overlay
		this.connectOverlay = new ActionOverlayBase(this.config.playerElement, connectOverlayHtml, connectOverlayHtmlInner);
	}

	/**
	 * Builds the play overlay 
	 */
	buildPlayOverlay() {
		// build the overlay base div 
		let playOverlayHtml = document.createElement('div');
		playOverlayHtml.id = "playOverlay";
		playOverlayHtml.className = "clickableState";

		// set the event Listener
		let playOverlayEvent: EventListener = () => this.onPlayAction();

		// add the new event listener 
		playOverlayHtml.addEventListener('click', function onOverlayClick(event: Event) {
			playOverlayEvent(event);
		});

		// build the inner html 
		let playOverlayHtmlInner = document.createElement('img');
		playOverlayHtmlInner.id = 'playButton';
		playOverlayHtmlInner.src = Images.playButton;
		playOverlayHtmlInner.alt = 'Start Streaming';

		// instantiate the overlay
		this.playOverlay = new ActionOverlayBase(this.config.playerElement, playOverlayHtml, playOverlayHtmlInner);
	}

	/**
	 * Builds the Afk overlay 
	 */
	buildAfkOverlay() {
		// build the overlay base div 
		let afkOverlayHtml = document.createElement('div');
		afkOverlayHtml.id = "afkOverlay";
		afkOverlayHtml.className = "clickableState";

		let afkOverlayEvent: EventListener = () => this.onAfkAction();

		afkOverlayHtml.addEventListener('click', function onOverlayClick(event: Event) {
			afkOverlayEvent(event);
		});

		// build the inner html
		let afkOverlayHtmlInner = document.createElement('div');
		afkOverlayHtmlInner.id = 'afkOverlayInner';
		afkOverlayHtmlInner.innerHTML = '<center>No activity detected<br>Disconnecting in <span id="afkCountDownNumber"></span> seconds<br>Click to continue<br></center>'

		// instantiate the overlay
		this.afkOverlay = new AfkOverlayBase(this.config.playerElement, afkOverlayHtml, afkOverlayHtmlInner, "afkCountDownNumber");
	}

	/**
	 * Builds the info overlay 
	 */
	buildInfoOverlay() {
		// build the overlay base div 
		let infoOverlayHtml = document.createElement('div');
		infoOverlayHtml.id = "infoOverlay";
		infoOverlayHtml.className = "textDisplayState";

		// build the inner html
		let infoOverlayHtmlInner = document.createElement('div');
		infoOverlayHtmlInner.id = 'messageOverlayInner';

		// instantiate the overlay
		this.infoOverlay = new TextOverlayBase(this.config.playerElement, infoOverlayHtml, infoOverlayHtmlInner);
	}

	/**
	 * Builds the error overlay 
	 */
	buildErrorOverlay() {
		// build the overlay base div 
		let errorOverlayHtml = document.createElement('div');
		errorOverlayHtml.id = "errorOverlay";
		errorOverlayHtml.className = "textDisplayState";

		// build the inner html
		let errorOverlayHtmlInner = document.createElement('div');
		errorOverlayHtmlInner.id = 'errorOverlayInner';
		errorOverlayHtmlInner.classList.add(".text-danger");

		// instantiate the overlay
		this.errorOverlay = new TextOverlayBase(this.config.playerElement, errorOverlayHtml, errorOverlayHtmlInner);
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
				instanceStateMessage = "Instance is Ready: " + instanceState.details;
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
				return;
			}

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

			// insert the inner html into the base div
			this.showTextOverlay(instanceStateMessage + spinnerDiv.outerHTML);
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
		this.enlargeDisplayToFillWindow.onchange = () => {
			this.iWebRtcController.resizePlayerStyle();
			this.iWebRtcController.setEnlargeToFillDisplay(this.enlargeDisplayToFillWindow.checked);
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

		// show and hide the optional buttons for stream tools 
		document.getElementById("streamToolsButton").onclick = () => {
			document.getElementById("streamToolsSettings").classList.toggle("d-none");
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
	 * Handle when the Video has been Initialised
	 */
	onVideoInitialised() {
		// starting a latency check
		document.getElementById("btn-start-latency-test").onclick = () => {
			this.iWebRtcController.sendLatencyTest();
		}

		// Set up stream tools header functionality
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
	 * Extended from the base functionality; displays the error overlay and resets the buttons stream tools upon disconnect 
	 * @param eventText 
	 */
	onDisconnect(eventText: string) {
		// display the text overlay by calling its super method so it will use its default behavior first 
		super.onDisconnect(`${eventText} \n Click To Restart`);

		// update all of the tools upon disconnect 
		this.onVideoEncoderAvgQP(0);

		// starting a latency check
		document.getElementById("btn-start-latency-test").onclick = () => { }

		// Set up stream tools header functionality
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
	 * Handles when the ownership flag is sent from the signaling server
	 * @param hasQualityOwnership - flag if the user has quality ownership
	 */
	onQualityControlOwnership(hasQualityOwnership: boolean): void {
		this.qualityControlOwnershipCheckBox.checked = hasQualityOwnership;
	}

	/**
	  * Calls updateQpTooltip to update the QP colour light
	  * @param QP - The video encoder QP number needed to find the average
	  */
	onVideoEncoderAvgQP(QP: number): void {
		this.videoQpIndicator.updateQpTooltip(QP);
	}
}

/**
 * The static check to allow verbose logging
 */
export class LoggingOptions {
	static verboseLogging = false;
}

/**
 * The static image for the play button
 */
export class Images {
	static playButton: string = "data:image/png;base64,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"
}
