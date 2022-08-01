import { UeInputMouseMessage } from "../UeInstanceMessage/UeInputMouseMessage";
import { MouseButtonsMask, MouseButton } from "./MouseButtons";
import { DataChannelController } from "../DataChannel/DataChannelController";
import { NormaliseAndQuantiseSigned, UnquantisedAndDenormaliseUnsigned, NormaliseAndQuantiseUnsigned } from "./CoordinateData"
import { Logger } from "../Logger/Logger";
import { IVideoPlayer } from "../VideoPlayer/IVideoPlayer";

/**
 * Handles the Mouse Inputs for the document
 */
export class MouseController {

	readonly unsignedOutOfRange: number = 65535;
	readonly signedOutOfRange: number = 32767;

	ueInputMouseMessage: UeInputMouseMessage;
	videoElementProvider: IVideoPlayer;

	printInputs: boolean;

	/**
	 * 
	 * @param dataChannelController - Data Channel Controller
	 */
	constructor(dataChannelController: DataChannelController, videoElementProvider: IVideoPlayer) {
		this.printInputs = false;
		this.ueInputMouseMessage = new UeInputMouseMessage(dataChannelController);
		this.videoElementProvider = videoElementProvider;
	}

	/**
	 * Handle when a mouse button is released
	 * @param buttons - Mouse Button
	 * @param X - Mouse pointer X coordinate
	 * @param Y - Mouse pointer Y coordinate
	 */
	releaseMouseButtons(buttons: number, X: number, Y: number) {
		if (buttons & MouseButtonsMask.primaryButton) {
			this.sendMouseUp(MouseButton.mainButton, X, Y);
		}
		if (buttons & MouseButtonsMask.secondaryButton) {
			this.sendMouseUp(MouseButton.secondaryButton, X, Y);
		}
		if (buttons & MouseButtonsMask.auxiliaryButton) {
			this.sendMouseUp(MouseButton.auxiliaryButton, X, Y);
		}
		if (buttons & MouseButtonsMask.fourthButton) {
			this.sendMouseUp(MouseButton.fourthButton, X, Y);
		}
		if (buttons & MouseButtonsMask.fifthButton) {
			this.sendMouseUp(MouseButton.fifthButton, X, Y);
		}
	}

	/**
	 * Handle when a mouse button is pressed
	 * @param buttons - Mouse Button
	 * @param X - Mouse pointer X coordinate
	 * @param Y - Mouse pointer Y coordinate
	 */
	pressMouseButtons(buttons: number, X: number, Y: number) {
		if (buttons & MouseButtonsMask.primaryButton) {
			this.sendMouseDown(MouseButton.mainButton, X, Y);
		}
		if (buttons & MouseButtonsMask.secondaryButton) {
			this.sendMouseDown(MouseButton.secondaryButton, X, Y);
		}
		if (buttons & MouseButtonsMask.auxiliaryButton) {
			this.sendMouseDown(MouseButton.auxiliaryButton, X, Y);
		}
		if (buttons & MouseButtonsMask.fourthButton) {
			this.sendMouseDown(MouseButton.fourthButton, X, Y);
		}
		if (buttons & MouseButtonsMask.fifthButton) {
			this.sendMouseDown(MouseButton.fifthButton, X, Y);
		}
	}

	/**
	 * Handle when a mouse is moved
	 * @param X - Mouse X Coordinate
	 * @param Y - Mouse Y Coordinate
	 * @param deltaX - Mouse Delta X Coordinate
	 * @param deltaY - Mouse Delta Y Coordinate
	 */
	sendMouseMove(X: number, Y: number, deltaX: number, deltaY: number) {
		if (this.printInputs) {
			Logger.Log(Logger.GetStackTrace(), `x: ${X}, y:${Y}, dX: ${deltaX}, dY: ${deltaY}`, 7);
		}

		let mouseCord: NormaliseAndQuantiseUnsigned = this.normaliseAndQuantiseUnsigned(X, Y);
		let deltaCode: NormaliseAndQuantiseSigned = this.normaliseAndQuantiseSigned(deltaX, deltaY);

		this.ueInputMouseMessage.sendMouseMove(mouseCord.x, mouseCord.y, deltaCode.x, deltaCode.y);
	}


	/**
	 * Handles when a mouse button is pressed down
	 * @param button - Mouse Button Pressed
	 * @param X  - Mouse X Coordinate
	 * @param Y  - Mouse Y Coordinate
	 */
	sendMouseDown(button: number, X: number, Y: number) {
		Logger.Log(Logger.GetStackTrace(), `mouse button ${button} down at (${X}, ${Y})`, 6);
		let coord: NormaliseAndQuantiseUnsigned = this.normaliseAndQuantiseUnsigned(X, Y);
		this.ueInputMouseMessage.sendMouseDown(button, coord.x, coord.y);
	}

	/**
	 * Handles when a mouse button is pressed up
	 * @param button - Mouse Button Pressed
	 * @param X  - Mouse X Coordinate
	 * @param Y  - Mouse Y Coordinate
	 */
	sendMouseUp(button: number, X: number, Y: number) {
		Logger.Log(Logger.GetStackTrace(), `mouse button ${button} up at (${X}, ${Y})`, 6);
		let coord: NormaliseAndQuantiseUnsigned = this.normaliseAndQuantiseUnsigned(X, Y);
		this.ueInputMouseMessage.sendMouseUp(button, coord.x, coord.y);
	}

	/**
	 * Handles when a mouse wheel event
	 * @param deltaY - Mouse Wheel data
	 * @param X  - Mouse X Coordinate
	 * @param Y  - Mouse Y Coordinate
	 */
	sendMouseWheel(deltaY: number, X: number, Y: number) {
		Logger.Log(Logger.GetStackTrace(), `mouse wheel with delta ${deltaY} at (${X}, ${Y})`, 6);
		let coord: NormaliseAndQuantiseUnsigned = this.normaliseAndQuantiseUnsigned(X, Y);
		this.ueInputMouseMessage.sendMouseWheel(deltaY, coord.x, coord.y);
	}

	/**
	 * Handles mouse enter
	 */
	sendMouseEnter() {
		this.ueInputMouseMessage.sendMouseEnter();
	}

	/**
	 * Handles mouse Leave
	 */
	sendMouseLeave() {
		this.ueInputMouseMessage.sendMouseLeave();
	}

	/**
	 * Normalises and Quantised the Mouse Coordinates	
	 * @param x - Mouse X Coordinate
	 * @param y - Mouse Y Coordinate
	 * @returns - Normalize And Quantize Unsigned Data Type
	 */
	normaliseAndQuantiseUnsigned(x: number, y: number): NormaliseAndQuantiseUnsigned {

		let rootDiv = this.videoElementProvider.getVideoParentElement();
		let videoElement = this.videoElementProvider.getVideoElement();

		if (rootDiv && videoElement) {
			let playerAspectRatio = rootDiv.clientHeight / rootDiv.clientWidth;
			let videoAspectRatio = videoElement.videoHeight / videoElement.videoWidth;

			// Unsigned XY positions are the ratio (0.0..1.0) along a viewport axis,
			// quantized into an uint16 (0..65536).
			// Signed XY deltas are the ratio (-1.0..1.0) along a viewport axis,
			// quantized into an int16 (-32767..32767).
			// This allows the browser viewport and client viewport to have a different
			// size.
			// Hack: Currently we set an out-of-range position to an extreme (65535)
			// as we can't yet accurately detect mouse enter and leave events
			// precisely inside a video with an aspect ratio which causes mattes.
			if (playerAspectRatio > videoAspectRatio) {
				Logger.Log(Logger.GetStackTrace(), 'Setup Normalize and Quantize for playerAspectRatio > videoAspectRatio', 6);

				let ratio = playerAspectRatio / videoAspectRatio;
				// Unsigned.
				let normalizedX = x / rootDiv.clientWidth;
				let normalizedY = ratio * (y / rootDiv.clientHeight - 0.5) + 0.5;

				if (normalizedX < 0.0 || normalizedX > 1.0 || normalizedY < 0.0 || normalizedY > 1.0) {
					return {
						inRange: false,
						x: this.unsignedOutOfRange,
						y: this.unsignedOutOfRange
					}
				} else {
					return {
						inRange: true,
						x: normalizedX * (this.unsignedOutOfRange + 1),
						y: normalizedY * (this.unsignedOutOfRange + 1)
					};
				}
			} else {
				Logger.Log(Logger.GetStackTrace(), 'Setup Normalize and Quantize for playerAspectRatio <= videoAspectRatio', 6);

				let ratio = videoAspectRatio / playerAspectRatio;
				// Unsigned.
				let normalizedX = ratio * (x / rootDiv.clientWidth - 0.5) + 0.5;
				let normalizedY = y / rootDiv.clientHeight;
				if (normalizedX < 0.0 || normalizedX > 1.0 || normalizedY < 0.0 || normalizedY > 1.0) {
					return {
						inRange: false,
						x: this.unsignedOutOfRange,
						y: this.unsignedOutOfRange
					};
				} else {
					return {
						inRange: true,
						x: normalizedX * (this.unsignedOutOfRange + 1),
						y: normalizedY * (this.unsignedOutOfRange + 1)
					};
				}
			}
		}
	}

	/**
	 * Denormalises and unquantised the Mouse Coordinates	
	 * @param x - Mouse X Coordinate
	 * @param y - Mouse Y Coordinate
	 * @returns - unquantise and Denormalize Unsigned Data Type
	 */
	unquantiseAndDenormaliseUnsigned(x: number, y: number): UnquantisedAndDenormaliseUnsigned {

		let rootDiv = this.videoElementProvider.getVideoParentElement();
		let videoElement = this.videoElementProvider.getVideoElement();

		if (rootDiv && videoElement) {
			let playerAspectRatio = rootDiv.clientHeight / rootDiv.clientWidth;
			let videoAspectRatio = videoElement.videoHeight / videoElement.videoWidth;

			// Unsigned XY positions are the ratio (0.0..1.0) along a viewport axis,
			// quantized into an uint16 (0..65536).
			// Signed XY deltas are the ratio (-1.0..1.0) along a viewport axis,
			// quantized into an int16 (-32767..32767).
			// This allows the browser viewport and client viewport to have a different
			// size.
			// Hack: Currently we set an out-of-range position to an extreme (65535)
			// as we can't yet accurately detect mouse enter and leave events
			// precisely inside a video with an aspect ratio which causes mattes.
			if (playerAspectRatio > videoAspectRatio) {
				Logger.Log(Logger.GetStackTrace(), 'Setup Normalize and Quantize for playerAspectRatio > videoAspectRatio', 6);

				let ratio = playerAspectRatio / videoAspectRatio;
				// Unsigned.
				let normalizedX = x / (this.unsignedOutOfRange + 1);
				let normalizedY = (y / (this.unsignedOutOfRange + 1) - 0.5) / ratio + 0.5;

				return {
					x: normalizedX * rootDiv.clientWidth,
					y: normalizedY * rootDiv.clientHeight
				}

			} else {
				Logger.Log(Logger.GetStackTrace(), 'Setup Normalize and Quantize for playerAspectRatio <= videoAspectRatio', 6);

				let ratio = videoAspectRatio / playerAspectRatio;
				// Unsigned.
				let normalizedX = (x / (this.unsignedOutOfRange + 1) - 0.5) / ratio + 0.5;
				let normalizedY = y / (this.unsignedOutOfRange + 1);
				return {
					x: normalizedX * rootDiv.clientWidth,
					y: normalizedY * rootDiv.clientHeight
				}
			}
		}
	}

	/**
	 * Normalises and Quantised the Mouse Coordinates	
	 * @param x - Mouse X Coordinate
	 * @param y - Mouse Y Coordinate
	 * @returns - Normalize And Quantize Signed Data Type
	 */
	normaliseAndQuantiseSigned(x: number, y: number): NormaliseAndQuantiseSigned {

		let rootDiv = this.videoElementProvider.getVideoParentElement();
		let videoElement = this.videoElementProvider.getVideoElement();

		if (rootDiv && videoElement) {
			let playerAspectRatio = rootDiv.clientHeight / rootDiv.clientWidth;
			let videoAspectRatio = videoElement.videoHeight / videoElement.videoWidth;

			// Unsigned XY positions are the ratio (0.0..1.0) along a viewport axis,
			// quantized into an uint16 (0..65536).
			// Signed XY deltas are the ratio (-1.0..1.0) along a viewport axis,
			// quantized into an int16 (-32767..32767).
			// This allows the browser viewport and client viewport to have a different
			// size.
			// Hack: Currently we set an out-of-range position to an extreme (65535)
			// as we can't yet accurately detect mouse enter and leave events
			// precisely inside a video with an aspect ratio which causes mattes.
			if (playerAspectRatio > videoAspectRatio) {
				Logger.Log(Logger.GetStackTrace(), 'Setup Normalize and Quantize for playerAspectRatio > videoAspectRatio', 6);

				let ratio = playerAspectRatio / videoAspectRatio;
				// Unsigned.
				let normalizedX = x / (0.5 * rootDiv.clientWidth);
				let normalizedY = (ratio * y) / (0.5 * rootDiv.clientHeight);
				return {
					x: normalizedX * this.signedOutOfRange,
					y: normalizedY * this.signedOutOfRange
				}

			} else {
				if (this.printInputs) {
					Logger.Log(Logger.GetStackTrace(), 'Setup Normalize and Quantize for playerAspectRatio <= videoAspectRatio', 6);
				}
				let ratio = videoAspectRatio / playerAspectRatio;
				// Signed.
				let normalizedX = (ratio * x) / (0.5 * rootDiv.clientWidth);
				let normalizedY = y / (0.5 * rootDiv.clientHeight);
				return {
					x: normalizedX * this.signedOutOfRange,
					y: normalizedY * this.signedOutOfRange
				}
			}
		}
	}
}