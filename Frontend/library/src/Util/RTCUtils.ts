export class RTCUtils {
    static isVideoTransciever(transceiver : RTCRtpTransceiver | undefined) : boolean {
        return this.canTransceiverReceiveVideo(transceiver) || this.canTransceiverSendVideo(transceiver);
    }

    static canTransceiverReceiveVideo(transceiver : RTCRtpTransceiver | undefined) : boolean {
        return !!transceiver &&
            (transceiver.direction === 'sendrecv' || transceiver.direction === 'recvonly') &&
            transceiver.receiver &&
            transceiver.receiver.track &&
            transceiver.receiver.track.kind === 'video';    
    }

    static canTransceiverSendVideo(transceiver : RTCRtpTransceiver | undefined) : boolean {
        return !!transceiver &&
            (transceiver.direction === 'sendrecv' || transceiver.direction === 'sendonly') &&
            transceiver.sender &&
            transceiver.sender.track &&
            transceiver.sender.track.kind === 'video';    
    }

    static isAudioTransciever(transceiver : RTCRtpTransceiver | undefined) : boolean {
        return this.canTransceiverReceiveAudio(transceiver) || this.canTransceiverSendAudio(transceiver);
    }

    static canTransceiverReceiveAudio(transceiver : RTCRtpTransceiver | undefined) : boolean {
        return !!transceiver &&
            (transceiver.direction === 'sendrecv' || transceiver.direction === 'recvonly') &&
            transceiver.receiver &&
            transceiver.receiver.track &&
            transceiver.receiver.track.kind === 'audio';    
    }

    static canTransceiverSendAudio(transceiver : RTCRtpTransceiver | undefined) : boolean {
        return !!transceiver &&
            (transceiver.direction === 'sendrecv' || transceiver.direction === 'sendonly') &&
            transceiver.sender &&
            transceiver.sender.track &&
            transceiver.sender.track.kind === 'audio';
    }
}