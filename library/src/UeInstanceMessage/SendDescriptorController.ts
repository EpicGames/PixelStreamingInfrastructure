import { DataChannelController } from "../DataChannel/DataChannelController";
import { IStreamMessageController } from "./IStreamMessageController";
import { Logger } from "../Logger/Logger";
import { UeDataMessage } from "./UeDataMessage";

export class SendDescriptorController extends UeDataMessage {

    toStreamerMessagesMapProvider: IStreamMessageController;

    constructor(datachannelController: DataChannelController, toStreamerMessagesMapProvider: IStreamMessageController) {
        super(datachannelController);
        this.toStreamerMessagesMapProvider = toStreamerMessagesMapProvider;
    }

    /**
     * Send a set res UI Descriptor to UE Instance
     * @param width - Width of res
     * @param height - Height of res
     */
    sendUpdateVideoStreamSize(width: number, height: number) {
        this.emitCommand("r.setres " + width + "x" + height);
    }

    /**
     * Send a stat fps UI Descriptor to UE Instance
     */
    sendShowFps() {
        this.emitCommand("stat fps");
    }

    /**
     * Send a Encoder Rate Control to UE Instance
     * @param rateControl - Rate Control "CBR" | "VBR" | "ConstQP" 
     */
    sendEncoderRateControl(rateControl: "CBR" | "VBR" | "ConstQP") {
        this.emitCommand("PixelStreaming.Encoder.RateControl " + rateControl);
    }

    /**
     * Send Encoder Target Bit Rate to the UE Instance
     * @param targetBitRate - Send a Target Bit Rate
     */
    sendEncoderTargetBitRate(targetBitRate: number) {
        this.emitCommand("PixelStreaming.Encoder.TargetBitrate " + (targetBitRate > 0 ? targetBitRate : -1));
    }

    /**
     * Send Encoder Max Bit Rate VBR to UE Instance
     * @param maxBitRate - Send A Max Bit Rate
     */
    sendEncoderMaxBitrateVbr(maxBitRate: number) {
        this.emitCommand("PixelStreaming.Encoder.MaxBitrateVBR " + (maxBitRate > 0 ? maxBitRate : 1));
    }

    /**
     * Send the Minimum Quantization Parameter to the UE Instance
     * @param minQP - Minimum Quantization Parameter 
     */
    sendEncoderMinQP(minQP: number) {
        this.emitCommand("PixelStreaming.Encoder.MinQP " + minQP);
    }

    /**
     * Send the Maximum Quantization Parameter to the UE Instance
     * @param maxQP - Maximum Quantization Parameter 
     */
    sendEncoderMaxQP(maxQP: number) {
        this.emitCommand("PixelStreaming.Encoder.MaxQP " + maxQP);
    }

    /**
     * Send Enable Filler Data to the UE Instance
     * @param enable - True
     */
    sendEncoderEnableFillerData(enable: boolean) {
        this.emitCommand("PixelStreaming.Encoder.EnableFillerData " + Number(enable).valueOf());
    }

    /**
     * Send Encoder MultiPass to UE Instance
     * @param multiPass - MultiPass "DISABLED" | "QUARTER" | "FULL"
     */
    sendEncoderMultiPass(multiPass: "DISABLED" | "QUARTER" | "FULL") {
        this.emitCommand("PixelStreaming.Encoder.Multipass " + multiPass);
    }

    /**
     * Send a Web RTC Degradation Preference to UE Instance
     * @param DegradationPreference - Degradation Preference "BALANCED" | "MAINTAIN_FRAMERATE" | "MAINTAIN_RESOLUTION"
     */
    sendWebRtcDegradationPreference(DegradationPreference: "BALANCED" | "MAINTAIN_FRAMERATE" | "MAINTAIN_RESOLUTION") {
        this.emitCommand("PixelStreaming.WebRTC.DegradationPreference " + DegradationPreference);
    }

    /**
     * Sends the Max FPS to the UE Instance
     * @param MaxFps - Web RTC Max Frames Per Second
     */
    sendWebRtcMaxFps(MaxFps: number) {
        this.emitCommand("PixelStreaming.WebRTC.MaxFps " + MaxFps);
    }

    /**
    * Sends the FPS to the UE Instance used un UE 5.0
    * @param Fps - Web RTC Frames Per Second
    */
    sendWebRtcFps(Fps: number) {
        this.emitCommand("PixelStreaming.WebRTC.Fps " + Fps);
    }

    /**
     * Sends the Minimum bit rate to the UE Instance
     * @param MinBitrate - Web RTC Minimum Bitrate
     */
    sendWebRtcMinBitrate(MinBitrate: number) {
        this.emitCommand("PixelStreaming.WebRTC.MinBitrate " + MinBitrate);
    }

    /**
     * Sends the Maximum bit rate to the UE Instance
     * @param MaxBitrate - Web RTC Maximum Bitrate
     */
    sendWebRtcMaxBitrate(MaxBitrate: number) {
        this.emitCommand("PixelStreaming.WebRTC.MaxBitrate " + MaxBitrate);
    }

    /**
     * Sends the Low Quantization Parameter Threshold level to the UE Instance
     * @param LowQpThreshold - Low Quantization Parameter Threshold Level
     */
    sendWebRtcLowQpThreshold(LowQpThreshold: number) {
        this.emitCommand("PixelStreaming.WebRTC.LowQpThreshold " + LowQpThreshold);
    }

    /**
     * Sends the High Quantization Parameter Threshold level to the UE Instance
     * @param HighQpThreshold - High Quantization Parameter Threshold Level
     */
    sendWebRtcHighQpThreshold(HighQpThreshold: number) {
        this.emitCommand("PixelStreaming.WebRTC.HighQpThreshold " + HighQpThreshold);
    }

    emitCommand(descriptor: string) {
        let payload = {
            Console: descriptor
        }
        this.sendDescriptor("Command", JSON.stringify(payload));
    }

    emitUIInteraction(descriptor: string) {
        let payload = {
            Console: descriptor
        }
        this.sendDescriptor("UIInteraction", JSON.stringify(payload));
    }

    /**
     * Send a Descriptor to the UE Instances
     * @param messageType - UE Message Type
     * @param descriptor - Descriptor Message as JSON
     */
    sendDescriptor(messageType: string, descriptor: string) {
        // Convert the descriptor object into a JSON string.
        let descriptorAsString = JSON.stringify(descriptor);
        let toStreamerMessages = this.toStreamerMessagesMapProvider.getToStreamerMessageMap();
        let messageFormat = toStreamerMessages.getFromKey(messageType);
        if (messageFormat === undefined) {
            Logger.Error(Logger.GetStackTrace(), `Attempted to emit descriptor with message type: ${messageType}, but the frontend hasn't been configured to send such a message. Check you've added the message type in your cpp`);
        }

        Logger.Log(Logger.GetStackTrace(), "Sending: " + descriptor, 6);
        // Add the UTF-16 JSON string to the array byte buffer, going two bytes at
        // a time.
        let data = new DataView(new ArrayBuffer(1 + 2 + 2 * descriptorAsString.length));
        let byteIdx = 0;
        data.setUint8(byteIdx, messageFormat.id);
        byteIdx++;
        data.setUint16(byteIdx, descriptorAsString.length, true);
        byteIdx += 2;
        for (let i = 0; i < descriptorAsString.length; i++) {
            data.setUint16(byteIdx, descriptorAsString.charCodeAt(i), true);
            byteIdx += 2;
        }

        this.sendData(data.buffer);
    }

}