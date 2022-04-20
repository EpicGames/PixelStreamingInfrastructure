import { DataChannelController } from "../DataChannel/DataChannelController";
import { UeDataMessage } from "./UeDataMessage";
import { UeMessageType } from "./UeMessageTypes"

/**
 * Handles sending Mouse Messages to the UE Instance
 */
export class UeInputMouseMessage extends UeDataMessage {

	/**
	* @param datachannelController - Data channel Controller
	*/
	constructor(datachannelController: DataChannelController) {
		super(datachannelController);
	}

	/**
	 * Send Mouse Enter to the UE Instance
	 */
	sendMouseEnter() {
		let Data = new DataView(new ArrayBuffer(1));
		Data.setUint8(0, UeMessageType.mouseEnter);
		this.sendData(Data.buffer);
	}

	/**
	 * Send Mouse Leave to the UE Instance
	 */
	sendMouseLeave() {
		let Data = new DataView(new ArrayBuffer(1));
		Data.setUint8(0, UeMessageType.mouseLeave);
		this.sendData(Data.buffer);
	}

	/**
	 * Send Mouse Down to the UE Instance
	 * @param button - Mouse Button 
	 * @param X - X Coordinate Value of mouse 
	 * @param Y - Y Coordinate Value of mouse 
	 */
	sendMouseDown(button: number, X: number, Y: number) {
		let Data = new DataView(new ArrayBuffer(6));
		Data.setUint8(0, UeMessageType.mouseDown);
		Data.setUint8(1, button);
		Data.setUint16(2, X, true);
		Data.setUint16(4, Y, true);
		this.sendData(Data.buffer);
	}

	/**
	 * Send Mouse Up to the UE Instance
	 * @param button - Mouse Button 
	 * @param X - X Coordinate Value of mouse 
	 * @param Y - Y Coordinate Value of mouse 
	 */
	sendMouseUp(button: number, X: number, Y: number) {
		let Data = new DataView(new ArrayBuffer(6));
		Data.setUint8(0, UeMessageType.mouseUp);
		Data.setUint8(1, button);
		Data.setUint16(2, X, true);
		Data.setUint16(4, Y, true);
		this.sendData(Data.buffer);
	}

	/**
	 * Send Mouse Move to the UE Instance
	 * @param mouseCordX - X Mouse Coordinate
	 * @param mouseCordY - Y Mouse Coordinate
	 * @param deltaX - X Mouse Delta Coordinate
	 * @param deltaY - Y Mouse Delta Coordinate
	 */
	sendMouseMove(mouseCordX: number, mouseCordY: number, deltaX: number, deltaY: number) {
		let Data = new DataView(new ArrayBuffer(9));
		Data.setUint8(0, UeMessageType.mouseMove);
		Data.setUint16(1, mouseCordX, true);
		Data.setUint16(3, mouseCordY, true);
		Data.setInt16(5, deltaX, true);
		Data.setInt16(7, deltaY, true);
		this.sendData(Data.buffer);
	}

	/**
	 * Send Mouse wheel event to the UE Instance
	 * @param deltaY - Mouse Wheel delta Y
	 * @param X - Mouse X Coordinate
	 * @param Y - Mouse Y Coordinate
	 */
	sendMouseWheel(deltaY: number, X: number, Y: number) {
		let Data = new DataView(new ArrayBuffer(7));
		Data.setUint8(0, UeMessageType.mouseWheel);
		Data.setInt16(1, deltaY, true);
		Data.setUint16(3, X, true);
		Data.setUint16(5, Y, true);
		this.sendData(Data.buffer);
	}
}