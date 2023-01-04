import { Logger } from "../Logger/Logger";
import { SettingFlag } from "./SettingFlag";
import { SettingNumber } from "./SettingNumber";

/**
 * A collection of toggable flags that are core to all Pixel Streaming experiences.
 * These are used in the `Config.Flags` map. Note, that map can take any string but
 * these flags are provided for convenience to avoid hardcoded strings across the library.
 */
export class Flags {
	static UseMic = "UseMic";
	static BrowserSendOffer = "offerToReceive";
	static PreferSFU = "preferSFU";
	static IsQualityController = "ControlsQuality";
	static ForceMonoAudio = "ForceMonoAudio";
	static ForceTURN = "ForceTURN";
	static AFKDetection = "TimeoutIfIdle";
	static VideoFillWindow = "FillWindow";
	static MatchViewportResolution = "MatchViewportRes";
	static ControlScheme = "HoveringMouse"
}

/**
 * A collection of numeric parameters that are core to all Pixel Streaming experiences.
 * 
 */
export class NumericParameters {
	static MinQP = "MinQP";
	static MaxQP = "MaxQP";
	static WebRTCFPS = "WebRTCFPS";
	static WebRTCMinBitrate = "WebRTCMinBitrate";
	static WebRTCMaxBitrate = "WebRTCMaxBitrate";
}

export class Config {

	// PRESET OPTIONS
	// enable the auto connect of the websocket 
	enableSpsAutoConnect = false;

	// enable the autoplay of the video if enabled by browser
	enableSpsAutoplay = true;

	// start the video muted
	startVideoMuted = false;

	// set the amount of wait time in seconds while there is inactivity for afk to occur 
	afkTimeout = 120;

	// The control scheme controls the behaviour of the mouse when it interacts with the WebRTC player.
	controlScheme = ControlSchemeType.LockedMouse;

	// Browser keys are those which are typically used by the browser UI. We usually want to suppress these to allow, for example, UE to show shader complexity with the F5 key without the web page refreshing.
	suppressBrowserKeys = true;

	// UE has a fake touches option which fakes a single finger touch when the user drags with their mouse. 
	// We may perform the reverse; a single finger touch may be converted into a mouse drag UE side. This allows a non-touch application to be controlled partially via a touch device.
	fakeMouseWithTouches = false;

	//compulsory options and DOMs 
	signallingServerAddress: string;

	/* A map of toggable flags - options that can be set in the application - e.g. Use Mic? */
	flags = new Map<string, SettingFlag>();

	/* A map of numerical settings - options that can be in the application - e.g. MinBitrate */
	numericParameters = new Map<string, SettingNumber>();

	/**
	 * @param signallingServerAddress - the address of the signaling server 
	 */
	constructor(signallingServerAddress: string) {
		this.signallingServerAddress = signallingServerAddress;
	}

	/**
	 * Make DOM elments for a settings section with a heading.
	 * @param settingsElem The parent container for our DOM elements.
	 * @param sectionHeading The heading element to go into the section.
	 * @returns The constructed DOM element for the section.
	 */
	buildSectionWithHeading(settingsElem: HTMLElement, sectionHeading: string){
		// make section element
		const sectionElem = document.createElement("section");
		sectionElem.classList.add("settingsContainer");

		// make section heading
		const psSettingsHeader = document.createElement("div");
		psSettingsHeader.classList.add("settingsHeader");
		psSettingsHeader.classList.add("settings-text");
		psSettingsHeader.textContent = sectionHeading;

		// add section and heading to parent settings element
		sectionElem.appendChild(psSettingsHeader);
		settingsElem.appendChild(sectionElem);
		return sectionElem;
	}

	/**
	 * Setup flags with their default values and add them to the `Config.flags` map.
	 * @param settingsElem - The element that contains all the individual settings sections, flags, and so on.
	 */
	setupFlags(settingsElem : HTMLElement) : void {

		/* Setup all Pixel Streaming specific settings */
		const psSettingsSection = this.buildSectionWithHeading(settingsElem, "Pixel Streaming");

		const sendSDPAnswerSetting = new SettingFlag(
			Flags.BrowserSendOffer, 
			"Browser send offer", 
			"Browser will initiate the WebRTC handshake by sending the offer to the streamer", 
			false);

		const useMicSetting = new SettingFlag(
			Flags.UseMic, 
			"Use microphone", 
			"Make browser request microphone access and open an input audio track.", 
			false);

		const preferSFUSetting = new SettingFlag(
			Flags.PreferSFU, 
			"Prefer SFU", 
			"Try to connect to the SFU instead of P2P.", 
			false);

		const qualityControlSetting = new SettingFlag(
			Flags.IsQualityController, 
			"Is quality controller?", 
			"True if this peer controls stream quality", 
			true
		);

		const forceMonoAudioSetting = new SettingFlag(
			Flags.ForceMonoAudio, 
			"Force mono audio",
			"Force browser to request mono audio in the SDP", 
			false
		);

		const forceTURNSetting = new SettingFlag(
			Flags.ForceTURN, 
			"Force TURN",
			"Only generate TURN/Relayed ICE candidates.", 
			false
		);

		const afkIfIdleSetting = new SettingFlag(
			Flags.AFKDetection, 
			"AFK if idle",
			"Timeout the experience if user is AFK for a period.", 
			false
		);
		
		// make settings show up in DOM
		this.addSettingFlag(psSettingsSection, sendSDPAnswerSetting);
		this.addSettingFlag(psSettingsSection, useMicSetting);
		this.addSettingFlag(psSettingsSection, preferSFUSetting);
		this.addSettingFlag(psSettingsSection, qualityControlSetting);
		this.addSettingFlag(psSettingsSection, forceMonoAudioSetting);
		this.addSettingFlag(psSettingsSection, forceTURNSetting);
		this.addSettingFlag(psSettingsSection, afkIfIdleSetting);

		/* Setup all view/ui related settings under this section */
		const viewSettingsSection = this.buildSectionWithHeading(settingsElem, "UI");

		const fillWindowSetting = new SettingFlag(
			Flags.VideoFillWindow, 
			"Video fill window", 
			"Video will try to fill the available space.", 
			true);

		const matchViewportResSetting = new SettingFlag(
			Flags.MatchViewportResolution, 
			"Match viewport resolution", 
			"Pixel Streaming will be instructed to dynamically resize the video stream to match the size of the video element.", 
			false);

		const controlSchemeSetting = new SettingFlag(
			Flags.ControlScheme, 
			"Control Scheme: Locked Mouse", 
			"Either locked mouse, where the pointer is consumed by the video and locked to it, or hovering mouse, where the mouse is not consumed.", 
			false);

		this.addSettingFlag(viewSettingsSection, fillWindowSetting);
		this.addSettingFlag(viewSettingsSection, matchViewportResSetting);
		this.addSettingFlag(viewSettingsSection, controlSchemeSetting);
		// Update the configs control scheme based on the settings value
		this.controlScheme = (controlSchemeSetting.value) ? 1 : 0;
		controlSchemeSetting.label = `Control Scheme: ${(controlSchemeSetting.value) ? "Hovering" : "Locked"} Mouse`;

		/* Setup all encoder related settings under this section */
		const encoderSettingsSection = this.buildSectionWithHeading(settingsElem, "Encoder");

		const minQPSetting = new SettingNumber(
			NumericParameters.MinQP,
			"Min QP", 
			"The lower bound for the quantization parameter (QP) of the encoder. 0 = Best quality, 51 = worst quality.",
			0, /*min*/
			51, /*max*/
			0 /*value*/);

		const maxQPSetting = new SettingNumber(
			NumericParameters.MaxQP,
			"Max QP", 
			"The upper bound for the quantization parameter (QP) of the encoder. 0 = Best quality, 51 = worst quality.",
			0, /*min*/
			51, /*max*/
			51 /*value*/);

		this.addSettingNumeric(encoderSettingsSection, minQPSetting);
		this.addSettingNumeric(encoderSettingsSection, maxQPSetting);

		/* Setup all webrtc related settings under this section */
		const webrtcSettingsSection = this.buildSectionWithHeading(settingsElem, "WebRTC");

		const webrtcFPSSetting = new SettingNumber(
			NumericParameters.WebRTCFPS,
			"Max FPS", 
			"The maximum FPS that WebRTC will try to transmit frames at.",
			1, /*min*/
			999, /*max*/
			60 /*value*/);

		const webrtcMinBitrateSetting = new SettingNumber(
			NumericParameters.WebRTCMinBitrate,
			"Min Bitrate (kbps)", 
			"The minimum bitrate that WebRTC should use.",
			0, /*min*/
			100000, /*max*/
			0 /*value*/);

		const webrtcMaxBitrateSetting = new SettingNumber(
			NumericParameters.WebRTCMaxBitrate,
			"Max Bitrate (kbps)", 
			"The maximum bitrate that WebRTC should use.",
			0, /*min*/
			100000, /*max*/
			0 /*value*/);

		this.addSettingNumeric(webrtcSettingsSection, webrtcFPSSetting);
		this.addSettingNumeric(webrtcSettingsSection, webrtcMinBitrateSetting);
		this.addSettingNumeric(webrtcSettingsSection, webrtcMaxBitrateSetting);

	}

	/**
	 * Add a callback to fire when the numeric setting is toggled.
	 * @param id The id of the flag.
	 * @param onChangedListener The callback to fire when the numeric value changes.
	 */
	addOnNumericSettingChangedListener(id: string, onChangedListener: (newValue: number) => void) : void {
		if(this.numericParameters.has(id)){
			this.numericParameters.get(id).addOnChangedListener(onChangedListener);
		}
	}

	/**
	 * @param id The id of the numeric setting we are interested in getting a value for.
	 * @returns The numeric value stored in the parameter with the passed id.
	 */
	getNumericSettingValue(id: string) : number {
		if(this.numericParameters.has(id)){
			return this.numericParameters.get(id).number;
		}
		else {
			throw new Error(`There is no numeric setting with the id of ${id}`);
		}
	}

	/**
	 * Set number in the setting.
	 * @param id The id of the numeric setting we are interested in.
	 * @param value The numeric value to set.
	 */
	setNumericSetting(id: string, value: number) : void {
		if(this.numericParameters.has(id)){
			this.numericParameters.get(id).number = value;
		}
		else {
			throw new Error(`There is no numeric setting with the id of ${id}`);
		}
	}

	/**
	 * Add a callback to fire when the flag is toggled.
	 * @param id The id of the flag.
	 * @param onChangeListener The callback to fire when the value changes.
	 */
	addOnSettingChangedListener(id: string, onChangeListener: (newFlagValue: boolean) => void) : void {
		if(this.flags.has(id)){
			this.flags.get(id).onChange = onChangeListener;
		}
	}

	/**
	 * Add a SettingFlag element to a particular settings section in the DOM and registers that flag in the Config.flag map.
	 * @param settingsSection The settings section HTML element.
	 * @param settingFlag The settings flag object.
	 */
	addSettingFlag(settingsSection: HTMLElement, settingFlag: SettingFlag) : void {
		settingsSection.appendChild(settingFlag.rootElement);
		this.flags.set(settingFlag.id, settingFlag);
	}

	/**
	 * Add a SettingFlag element to a particular settings section in the DOM and registers that flag in the Config.flag map.
	 * @param settingsSection The settings section HTML element.
	 * @param settingFlag The settings flag object.
	 */
	addSettingNumeric(settingsSection: HTMLElement, setting: SettingNumber) : void {
		settingsSection.appendChild(setting.rootElement);
		this.numericParameters.set(setting.id, setting);
	}

	/**
	 * Get the value of the configruation flag which has the given id.
	 * @param id The unique id for the flag.
	 * @returns True if the flag is enabled.
	 */
	isFlagEnabled(id: string) : boolean {
		return this.flags.get(id).value as boolean;
	}

	/**
	 * Set flag to be enabled/disabled.
	 * @param id The id of the flag to toggle.
	 * @param flagEnabled True if the flag should be enabled.
	 */
	setFlagEnabled(id: string, flagEnabled: boolean) {
		if(!this.flags.has(id)) {
			Logger.Warning(Logger.GetStackTrace(), `Cannot toggle flag called ${id} - it does not exist in the Config.flags map.`);
		} else {
			this.flags.get(id).value = flagEnabled;
		}
	}

	/**
	 * Set the label for the flag.
	 * @param id The id of the flag.
	 * @param label The new label to use for the flag.
	 */
	setFlagLabel(id: string, label: string) {
		if(!this.flags.has(id)) {
			Logger.Warning(Logger.GetStackTrace(), `Cannot set label for flag called ${id} - it does not exist in the Config.flags map.`);
		} else {
			this.flags.get(id).label = label;
		}
	}

}

/**
 * The enum associated with the mouse being locked or hovering 
 */
export enum ControlSchemeType {
	LockedMouse = 0,
	HoveringMouse = 1,
}
