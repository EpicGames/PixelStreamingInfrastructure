/**
 * Data Channel Receives Message Type
 */
export enum DataChannelReceiveMessageType {
	QualityControlOwnership = 0,
	Response = 1,
	Command = 2,
	FreezeFrame = 3,
	UnfreezeFrame = 4,
	VideoEncoderAvgQP = 5,
	latencyTest = 6,
	InitialSettings = 7
}