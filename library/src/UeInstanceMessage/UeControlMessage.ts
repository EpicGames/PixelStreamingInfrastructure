import { DataChannelController } from "../DataChannel/DataChannelController";
import { UeMessageType } from "./UeMessageTypes";
import { UeDescriptor } from "./UeDescriptor";

/**
 * Handles Sending control messages to the UE Instance
 */
export class UeControlMessage extends UeDescriptor {

	/**
	 * 
	 * @param dataChannelController - Data Channel Controller
	 */
	constructor(dataChannelController: DataChannelController) {
		super(dataChannelController);
	}

	/**
	 * Send IFrame Request to the UE Instance
	 */
	SendIFrameRequest() {
		let payload = new Uint8Array([UeMessageType.iFrameRequest]);
		this.sendData(payload.buffer);

	}

	/**
	 * Send Request to Take Quality Control to the UE Instance
	 */
	SendRequestQualityControl() {
		let payload = new Uint8Array([UeMessageType.requestQualityControl]);
		this.sendData(payload.buffer);
	}

	/**
	 * Send Max FPS Request to the UE Instance
	 */
	SendMaxFpsRequest() {
		let payload = new Uint8Array([UeMessageType.maxFpsRequest]);
		this.sendData(payload.buffer);
	}

	/**
	 * Send Average Bitrate Request to the UE Instance
	 */
	SendAverageBitrateRequest() {
		let payload = new Uint8Array([UeMessageType.averageBitrateRequest]);
		this.sendData(payload.buffer);
	}

	/**
	 * Send a Start Streaming Message to the UE Instance
	 */
	SendStartStreaming() {
		let payload = new Uint8Array([UeMessageType.startStreaming]);
		this.sendData(payload.buffer);
	}

	/**
	 * Send a Stop Streaming Message to the UE Instance
	 */
	SendStopStreaming() {
		let payload = new Uint8Array([UeMessageType.stopStreaming]);
		this.sendData(payload.buffer);
	}

	/**
	 * Send a Latency Test to the UE Instance
	 * @param StartTimeMs - Start Time of the Latency test
	 */
	sendLatencyTest(StartTimeMs: number) {
		let payload = {
			StartTime: StartTimeMs,
		};

		this.sendDescriptor(UeMessageType.latencyTest, JSON.stringify(payload));
	}

	/**
	 * Send a Request Initial Settings to the UE Instance
	 */
	SendRequestInitialSettings() {
		let payload = new Uint8Array([UeMessageType.requestInitialSettings]);
		this.sendData(payload.buffer);
	}
}