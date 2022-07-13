export class Config {

	// PRESET OPTIONS
	// TODO: expose config through delegate so we don't need static
	static _enableVerboseLogging = false;

	// enable the auto connect of the websocket 
	enableSpsAutoConnect = false;

	// enable the autoplay of the video if enabled by browser
	enableSpsAutoplay = false;

	// start the video muted
	startVideoMuted = false;

	// set the amount of wait time in seconds while there is inactivity for afk to occur 
	afkTimeout: number = 120;

	// The control scheme controls the behaviour of the mouse when it interacts with the WebRTC player.
	controlScheme = ControlSchemeType.LockedMouse;

	// Browser keys are those which are typically used by the browser UI. We usually want to suppress these to allow, for example, UE4 to show shader complexity with the F5 key without the web page refreshing.
	suppressBrowserKeys = true;

	// UE4 has a fake touches option which fakes a single finger touch when the user drags with their mouse. 
	// We may perform the reverse; a single finger touch may be converted into a mouse drag UE4 side. This allows a non-touch application to be controlled partially via a touch device.
	fakeMouseWithTouches = false;

	//compulsory options and DOMs 
	signallingServerAddress: string;
	playerElement: HTMLDivElement;

	//this is a video element variable to be assigned when the video element is created
	videoPlayerElement: HTMLVideoElement;

	/**
	 * @param signallingServerAddress - the address of the signaling server 
	 * @param playerElement - the player element ID 
	 */
	constructor(signallingServerAddress: string, playerElement: HTMLDivElement) {
		this.signallingServerAddress = signallingServerAddress;
		this.playerElement = playerElement;
	}
}

/**
 * The enum associated with the mouse being locked or hovering 
 */
export enum ControlSchemeType {
	LockedMouse = 0,
	HoveringMouse = 1,
}
