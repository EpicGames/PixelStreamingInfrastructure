import { MouseButtonsMask, MouseButton } from "./MouseButtons";
import { Logger } from "../Logger/Logger";
import { IVideoPlayer } from "../VideoPlayer/IVideoPlayer";
import { IStreamMessageController } from "../UeInstanceMessage/IStreamMessageController";
import { INormalizeAndQuantize } from "../NormalizeAndQuantize/INormalizeAndQuantize";

/**
 * Handles the Mouse Inputs for the document
 */
export class MouseController {
	readonly unsignedOutOfRange: number = 65535;
	readonly signedOutOfRange: number = 32767;
	videoElementProvider: IVideoPlayer;
	printInputs: boolean;
	toStreamerMessagesProvider: IStreamMessageController;
	normalizeAndQuantize: INormalizeAndQuantize;

	/**
	 * 
	 * @param toStreamerMessagesProvider - Stream message controller provider
	 */
	constructor(toStreamerMessagesProvider: IStreamMessageController, videoElementProvider: IVideoPlayer, normalizeAndQuantize: INormalizeAndQuantize) {
		this.toStreamerMessagesProvider = toStreamerMessagesProvider;
		this.normalizeAndQuantize = normalizeAndQuantize;
		this.printInputs = false;
		this.videoElementProvider = videoElementProvider;
	}

	/**
	 * Handle when a mouse button is released
	 * @param buttons - Mouse Button
	 * @param X - Mouse pointer X coordinate
	 * @param Y - Mouse pointer Y coordinate
	 */
	releaseMouseButtons(buttons: number, X: number, Y: number) {
		let coord = this.normalizeAndQuantize.normalizeAndQuantizeUnsigned(X, Y);
		if (buttons & MouseButtonsMask.primaryButton) {
			this.sendMouseUp(MouseButton.mainButton, coord.x, coord.y);
		}
		if (buttons & MouseButtonsMask.secondaryButton) {
			this.sendMouseUp(MouseButton.secondaryButton, coord.x, coord.y);
		}
		if (buttons & MouseButtonsMask.auxiliaryButton) {
			this.sendMouseUp(MouseButton.auxiliaryButton, coord.x, coord.y);
		}
		if (buttons & MouseButtonsMask.fourthButton) {
			this.sendMouseUp(MouseButton.fourthButton, coord.x, coord.y);
		}
		if (buttons & MouseButtonsMask.fifthButton) {
			this.sendMouseUp(MouseButton.fifthButton, coord.x, coord.y);
		}
	}

	/**
	 * Handle when a mouse button is pressed
	 * @param buttons - Mouse Button
	 * @param X - Mouse pointer X coordinate
	 * @param Y - Mouse pointer Y coordinate
	 */
	pressMouseButtons(buttons: number, X: number, Y: number) {
		let coord = this.normalizeAndQuantize.normalizeAndQuantizeUnsigned(X, Y);
		if (buttons & MouseButtonsMask.primaryButton) {
			this.sendMouseDown(MouseButton.mainButton, coord.x, coord.y);
		}
		if (buttons & MouseButtonsMask.secondaryButton) {
			this.sendMouseDown(MouseButton.secondaryButton, coord.x, coord.y);
		}
		if (buttons & MouseButtonsMask.auxiliaryButton) {
			this.sendMouseDown(MouseButton.auxiliaryButton, coord.x, coord.y);
		}
		if (buttons & MouseButtonsMask.fourthButton) {
			this.sendMouseDown(MouseButton.fourthButton, coord.x, coord.y);
		}
		if (buttons & MouseButtonsMask.fifthButton) {
			this.sendMouseDown(MouseButton.fifthButton, coord.x, coord.y);
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

		let mouseCord = this.normalizeAndQuantize.normalizeAndQuantizeUnsigned(X, Y);
		let deltaCode = this.normalizeAndQuantize.normalizeAndQuantizeSigned(deltaX, deltaY);

		let toStreamerHandlers = this.toStreamerMessagesProvider.getToStreamHandlersMap();
		toStreamerHandlers.get("MouseMove")("MouseMove", [mouseCord.x, mouseCord.y, deltaCode.x, deltaCode.y]);
	}


	/**
	 * Handles when a mouse button is pressed down
	 * @param button - Mouse Button Pressed
	 * @param X  - Mouse X Coordinate
	 * @param Y  - Mouse Y Coordinate
	 */
	sendMouseDown(button: number, X: number, Y: number) {
		Logger.Log(Logger.GetStackTrace(), `mouse button ${button} down at (${X}, ${Y})`, 6);
		let toStreamerHandlers = this.toStreamerMessagesProvider.getToStreamHandlersMap();
		toStreamerHandlers.get("MouseDown")("MouseDown", [button, X, Y]);
	}

	/**
	 * Handles when a mouse button is pressed up
	 * @param button - Mouse Button Pressed
	 * @param X  - Mouse X Coordinate
	 * @param Y  - Mouse Y Coordinate
	 */
	sendMouseUp(button: number, X: number, Y: number) {
		Logger.Log(Logger.GetStackTrace(), `mouse button ${button} up at (${X}, ${Y})`, 6);
		let coord = this.normalizeAndQuantize.normalizeAndQuantizeUnsigned(X, Y);
		let toStreamerHandlers = this.toStreamerMessagesProvider.getToStreamHandlersMap();
		toStreamerHandlers.get("MouseUp")("MouseUp", [button, coord.x, coord.y]);
	}

	/**
	 * Handles when a mouse wheel event
	 * @param deltaY - Mouse Wheel data
	 * @param X  - Mouse X Coordinate
	 * @param Y  - Mouse Y Coordinate
	 */
	sendMouseWheel(deltaY: number, X: number, Y: number) {
		Logger.Log(Logger.GetStackTrace(), `mouse wheel with delta ${deltaY} at (${X}, ${Y})`, 6);
		let coord = this.normalizeAndQuantize.normalizeAndQuantizeUnsigned(X, Y);
		let toStreamerHandlers = this.toStreamerMessagesProvider.getToStreamHandlersMap();
		toStreamerHandlers.get("MouseWheel")("MouseWheel", [deltaY, coord.x, coord.y]);
	}

	/**
	 * Handles when a mouse button is double clicked
	 * @param button - Mouse Button Pressed
	 * @param X  - Mouse X Coordinate
	 * @param Y  - Mouse Y Coordinate
	 */
	sendMouseDouble(button: number, X: number, Y: number) {
		Logger.Log(Logger.GetStackTrace(), `mouse button ${button} up at (${X}, ${Y})`, 6);
		let coord = this.normalizeAndQuantize.normalizeAndQuantizeUnsigned(X, Y);
		let toStreamerHandlers = this.toStreamerMessagesProvider.getToStreamHandlersMap();
		toStreamerHandlers.get("MouseDouble")("MouseDouble", [button, coord.x, coord.y]);
	}

	/**
	 * Handles mouse enter
	 */
	sendMouseEnter() {
		let toStreamerHandlers = this.toStreamerMessagesProvider.getToStreamHandlersMap();
		toStreamerHandlers.get("MouseEnter")("MouseEnter");
	}

	/**
	 * Handles mouse Leave
	 */
	sendMouseLeave() {
		let toStreamerHandlers = this.toStreamerMessagesProvider.getToStreamHandlersMap();
		toStreamerHandlers.get("MouseLeave")("MouseLeave");
	}
}