/**
 * The Type of message sent to the UE instance over the data channel
 * Must be kept in sync with PixelStreamingProtocol::EToUE4Msg C++ enum.
 * {@link https://github.com/EpicGames/UnrealEngine/blob/release/Engine/Plugins/Media/PixelStreaming/Source/PixelStreaming/Private/ProtocolDefs.h} Requires Login
 */
export class UeMessageType {
	/**********************************************************************/

	/*
	 * Control Messages. Range = 0..49.
	 */
	static iFrameRequest = 0;
	static requestQualityControl = 1;
	static maxFpsRequest = 2;
	static averageBitrateRequest = 3;
	static startStreaming = 4;
	static stopStreaming = 5;
	static latencyTest = 6;
	static requestInitialSettings = 7;

	/**********************************************************************/

	/*
	 * Input Messages. Range = 50..89.
	 */

	// Generic Input Messages. Range = 50..59.
	static uiInteraction = 50;
	static command = 51;

	// Keyboard Input Message. Range = 60..69.
	static keyDown = 60;
	static keyUp = 61;
	static keyPress = 62;

	// Mouse Input Messages. Range = 70..79.
	static mouseEnter = 70;
	static mouseLeave = 71;
	static mouseDown = 72;
	static mouseUp = 73;
	static mouseMove = 74;
	static mouseWheel = 75;

	// Touch Input Messages. Range = 80..89.
	static touchStart = 80;
	static touchEnd = 81;
	static touchMove = 82;

	// Gamepad Input Messages. Range = 90..99
	static gamepadButtonPressed = 90;
	static gamepadButtonReleased = 91;
	static gamepadAnalog = 92;


	/**************************************************************************/
}