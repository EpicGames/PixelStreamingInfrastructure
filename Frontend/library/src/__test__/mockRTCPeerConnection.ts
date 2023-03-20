export interface MockRTCPeerConnectionSpyFunctions {
    constructorSpy: null | ((config: RTCConfiguration) => void);
    closeSpy: null | (() => void);
    setRemoteDescriptionSpy: null | ((description: RTCSessionDescriptionInit) => void);
    setLocalDescriptionSpy: null | ((description: RTCLocalSessionDescriptionInit) => void);
    createAnswerSpy: null | (() => void);
    addTransceiverSpy: null | ((trackOrKind: string | MediaStreamTrack, init?: RTCRtpTransceiverInit | undefined) => void);
    addIceCandidateSpy: null | ((candidate: RTCIceCandidateInit) => void);
    sendDataSpy: null | ((data: ArrayBuffer) => void);
}

export interface MockRTCPeerConnectionTriggerFunctions {
    triggerIceConnectionStateChange: null | ((state: RTCIceConnectionState) => void);
    triggerOnTrack: null | ((data: RTCTrackEventInit) => void);
    triggerOnIceCandidate: null | ((data: RTCPeerConnectionIceEventInit) => void);
    triggerOnDataChannel: null | ((data: RTCDataChannelEventInit) => void);
}

const spyFunctions: MockRTCPeerConnectionSpyFunctions = {
    constructorSpy: null,
    closeSpy: null,
    setRemoteDescriptionSpy: null,
    setLocalDescriptionSpy: null,
    createAnswerSpy: null,
    addTransceiverSpy: null,
    addIceCandidateSpy: null,
    sendDataSpy: null,
};

const triggerFunctions: MockRTCPeerConnectionTriggerFunctions = {
    triggerIceConnectionStateChange: null,
    triggerOnTrack: null,
    triggerOnIceCandidate: null,
    triggerOnDataChannel: null
};

export class MockRTCPeerConnectionImpl implements RTCPeerConnection {

    canTrickleIceCandidates: boolean | null;
    connectionState: RTCPeerConnectionState;
    currentLocalDescription: RTCSessionDescription | null;
    currentRemoteDescription: RTCSessionDescription | null;
    iceConnectionState: RTCIceConnectionState;
    iceGatheringState: RTCIceGatheringState;
    localDescription: RTCSessionDescription | null;
    pendingLocalDescription: RTCSessionDescription | null;
    pendingRemoteDescription: RTCSessionDescription | null;
    remoteDescription: RTCSessionDescription | null;
    sctp: RTCSctpTransport | null;
    signalingState: RTCSignalingState;
    _dataChannels: RTCDataChannel[] = [];

    constructor(config: RTCConfiguration) {
        this.connectionState = "new";
        this.iceConnectionState = "new";
        spyFunctions.constructorSpy?.(config);
        triggerFunctions.triggerIceConnectionStateChange = this.triggerIceConnectionStateChange.bind(this);
        triggerFunctions.triggerOnTrack = this.triggerOnTrack.bind(this);
        triggerFunctions.triggerOnIceCandidate = this.triggerOnIceCandidate.bind(this);
        triggerFunctions.triggerOnDataChannel =
            this.triggerOnDataChannel.bind(this);
    }

    onconnectionstatechange: ((this: RTCPeerConnection, ev: Event) => any) | null;
    ondatachannel: ((this: RTCPeerConnection, ev: RTCDataChannelEvent) => any) | null;
    onicecandidate: ((this: RTCPeerConnection, ev: RTCPeerConnectionIceEvent) => any) | null;
    onicecandidateerror: ((this: RTCPeerConnection, ev: Event) => any) | null;
    oniceconnectionstatechange: ((this: RTCPeerConnection, ev: Event) => any) | null;
    onicegatheringstatechange: ((this: RTCPeerConnection, ev: Event) => any) | null;
    onnegotiationneeded: ((this: RTCPeerConnection, ev: Event) => any) | null;
    onsignalingstatechange: ((this: RTCPeerConnection, ev: Event) => any) | null;
    ontrack: ((this: RTCPeerConnection, ev: RTCTrackEvent) => any) | null;
    addIceCandidate(candidate?: RTCIceCandidateInit | undefined): Promise<void>;
    addIceCandidate(candidate: RTCIceCandidateInit, successCallback: VoidFunction, failureCallback: RTCPeerConnectionErrorCallback): Promise<void>;
    addIceCandidate(candidate?: unknown, successCallback?: unknown, failureCallback?: unknown): Promise<void> {
        if (this.iceConnectionState !== "connected" && this.iceConnectionState !== "completed") {
            this.iceConnectionState = "checking";
        }
        this.oniceconnectionstatechange?.(new Event("iceconnectionstatechange"));
        spyFunctions.addIceCandidateSpy?.(candidate as RTCIceCandidateInit);
        return Promise.resolve();
    }
    addTrack(track: MediaStreamTrack, ...streams: MediaStream[]): RTCRtpSender {
        throw new Error("Method not implemented.");
    }
    addTransceiver(trackOrKind: string | MediaStreamTrack, init?: RTCRtpTransceiverInit | undefined): RTCRtpTransceiver {
        spyFunctions.addTransceiverSpy?.(trackOrKind, init);
        return {} as RTCRtpTransceiver;
    }
    createAnswer(options?: RTCAnswerOptions | undefined): Promise<RTCSessionDescriptionInit>;
    createAnswer(successCallback: RTCSessionDescriptionCallback, failureCallback: RTCPeerConnectionErrorCallback): Promise<void>;
    createAnswer(successCallback?: unknown, failureCallback?: unknown): Promise<void> | Promise<RTCSessionDescriptionInit> {
        spyFunctions.createAnswerSpy?.();
        const res: RTCSessionDescriptionInit = {
            type: "answer",
            sdp: "v=0\r\no=- 5791786663981007547 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0 1 2\r\na=extmap-allow-mixed\r\na=msid-semantic: WMS\r\nm=video 9 UDP/TLS/RTP/SAVPF 96 98\r\nc=IN IP4 0.0.0.0\r\na=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:z0li\r\na=ice-pwd:DkbG5Q3dFSIygDc47cms4TGA\r\na=ice-options:trickle\r\na=fingerprint:sha-256 F9:5B:3C:AB:89:88:0E:1B:2E:63:B3:D2:B8:92:59:E2:3A:46:B6:85:09:F4:50:0E:72:4F:9F:70:6D:5F:BD:1A\r\na=setup:active\r\na=mid:0\r\na=extmap:1 urn:ietf:params:rtp-hdrext:toffset\r\na=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r\na=extmap:3 urn:3gpp:video-orientation\r\na=extmap:4 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r\na=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r\na=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type\r\na=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r\na=extmap:8 http://www.webrtc.org/experiments/rtp-hdrext/color-space\r\na=extmap:9 urn:ietf:params:rtp-hdrext:sdes:mid\r\na=extmap:10 urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id\r\na=extmap:11 urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-id\r\na=recvonly\r\na=rtcp-mux\r\na=rtcp-rsize\r\na=rtpmap:96 H264/90000\r\na=rtcp-fb:96 goog-remb\r\na=rtcp-fb:96 transport-cc\r\na=rtcp-fb:96 ccm fir\r\na=rtcp-fb:96 nack\r\na=rtcp-fb:96 nack pli\r\na=fmtp:96 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r\na=rtpmap:98 H264/90000\r\na=rtcp-fb:98 goog-remb\r\na=rtcp-fb:98 transport-cc\r\na=rtcp-fb:98 ccm fir\r\na=rtcp-fb:98 nack\r\na=rtcp-fb:98 nack pli\r\na=fmtp:98 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111 63 110\r\nc=IN IP4 0.0.0.0\r\na=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:z0li\r\na=ice-pwd:DkbG5Q3dFSIygDc47cms4TGA\r\na=ice-options:trickle\r\na=fingerprint:sha-256 F9:5B:3C:AB:89:88:0E:1B:2E:63:B3:D2:B8:92:59:E2:3A:46:B6:85:09:F4:50:0E:72:4F:9F:70:6D:5F:BD:1A\r\na=setup:active\r\na=mid:1\r\na=extmap:14 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r\na=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r\na=extmap:4 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r\na=extmap:9 urn:ietf:params:rtp-hdrext:sdes:mid\r\na=recvonly\r\na=rtcp-mux\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\na=rtpmap:63 red/48000/2\r\na=fmtp:63 111/111\r\na=rtpmap:110 telephone-event/48000\r\nm=application 9 UDP/DTLS/SCTP webrtc-datachannel\r\nc=IN IP4 0.0.0.0\r\na=ice-ufrag:z0li\r\na=ice-pwd:DkbG5Q3dFSIygDc47cms4TGA\r\na=ice-options:trickle\r\na=fingerprint:sha-256 F9:5B:3C:AB:89:88:0E:1B:2E:63:B3:D2:B8:92:59:E2:3A:46:B6:85:09:F4:50:0E:72:4F:9F:70:6D:5F:BD:1A\r\na=setup:active\r\na=mid:2\r\na=sctp-port:5000\r\na=max-message-size:262144\r\n"
        };
        return Promise.resolve(res);
    }
    createDataChannel(label: string, dataChannelDict?: RTCDataChannelInit | undefined): RTCDataChannel {
        const dataChannel = new RTCDataChannel();
        this._dataChannels.push(dataChannel);
        return dataChannel;
    }
    createOffer(options?: RTCOfferOptions | undefined): Promise<RTCSessionDescriptionInit>;
    createOffer(successCallback: RTCSessionDescriptionCallback, failureCallback: RTCPeerConnectionErrorCallback, options?: RTCOfferOptions | undefined): Promise<void>;
    createOffer(successCallback?: unknown, failureCallback?: unknown, options?: unknown): Promise<void> | Promise<RTCSessionDescriptionInit> {
        throw new Error("Method not implemented.");
    }
    getConfiguration(): RTCConfiguration {
        throw new Error("Method not implemented.");
    }
    getReceivers(): RTCRtpReceiver[] {
        throw new Error("Method not implemented.");
    }
    getSenders(): RTCRtpSender[] {
        throw new Error("Method not implemented.");
    }
    getStats(selector?: MediaStreamTrack | null | undefined): Promise<RTCStatsReport> {
        const stats = {
            forEach: function (callbackfn: (value: any) => void): void {
                callbackfn({
                    type: 'candidate-pair',
                    bytesReceived: 123,
                });
                callbackfn({
                    type: 'local-candidate',
                    address: 'mock-address',
                });
            },
        };
        return Promise.resolve(stats as RTCStatsReport);
    }
    getTransceivers(): RTCRtpTransceiver[] {
        return [];
    }
    removeTrack(sender: RTCRtpSender): void {
        throw new Error("Method not implemented.");
    }
    restartIce(): void {
        throw new Error("Method not implemented.");
    }
    setConfiguration(configuration?: RTCConfiguration | undefined): void {
        throw new Error("Method not implemented.");
    }
    setLocalDescription(description?: RTCLocalSessionDescriptionInit | undefined): Promise<void>;
    setLocalDescription(description: RTCLocalSessionDescriptionInit, successCallback: VoidFunction, failureCallback: RTCPeerConnectionErrorCallback): Promise<void>;
    setLocalDescription(description?: unknown, successCallback?: unknown, failureCallback?: unknown): Promise<void> {
        spyFunctions.setLocalDescriptionSpy?.(description as RTCLocalSessionDescriptionInit);
        return Promise.resolve();
    }
    setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void>;
    setRemoteDescription(description: RTCSessionDescriptionInit, successCallback: VoidFunction, failureCallback: RTCPeerConnectionErrorCallback): Promise<void>;
    setRemoteDescription(description: unknown, successCallback?: unknown, failureCallback?: unknown): Promise<void> {
        spyFunctions.setRemoteDescriptionSpy?.(description as RTCSessionDescriptionInit);
        return Promise.resolve();
    }
    addEventListener<K extends keyof RTCPeerConnectionEventMap>(type: K, listener: (this: RTCPeerConnection, ev: RTCPeerConnectionEventMap[K]) => any, options?: boolean | AddEventListenerOptions | undefined): void;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions | undefined): void;
    addEventListener(type: unknown, listener: unknown, options?: unknown): void {
        throw new Error("Method not implemented.");
    }
    removeEventListener<K extends keyof RTCPeerConnectionEventMap>(type: K, listener: (this: RTCPeerConnection, ev: RTCPeerConnectionEventMap[K]) => any, options?: boolean | EventListenerOptions | undefined): void;
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions | undefined): void;
    removeEventListener(type: unknown, listener: unknown, options?: unknown): void {
        throw new Error("Method not implemented.");
    }
    dispatchEvent(event: Event): boolean {
        throw new Error("Method not implemented.");
    }
    static generateCertificate(keygenAlgorithm: AlgorithmIdentifier): Promise<RTCCertificate> {
        throw new Error("Method not implemented.");
    }

    close(): void {
        this.connectionState = "closed";
        this.iceConnectionState = "closed";
        this.onconnectionstatechange?.(new Event(this.connectionState));
        this.oniceconnectionstatechange?.(new Event(this.iceConnectionState));
        this._dataChannels.forEach((channel) => channel.close());
        spyFunctions.closeSpy?.();
    }

    triggerIceConnectionStateChange(state: RTCIceConnectionState) {
        this.iceConnectionState = state;
        const event = new Event(state);
        this.oniceconnectionstatechange?.(event);
    }

    triggerOnTrack(data: RTCTrackEventInit) {
        const event = new RTCTrackEvent('track', data);
        this.ontrack?.(event);
    }

    triggerOnIceCandidate(data: RTCPeerConnectionIceEventInit) {
        const event = new RTCPeerConnectionIceEvent('icecandidate', data);
        this.onicecandidate?.(event);
    }

    triggerOnDataChannel(data: RTCDataChannelEventInit) {
        this._dataChannels.push(data.channel);
        const event = new RTCDataChannelEvent('datachannel', data);
        this.ondatachannel?.(event);
    }
}

export class MockRTCIceCandidateImpl implements RTCIceCandidate {
    address: string | null;
    candidate: string;
    component: RTCIceComponent | null;
    foundation: string | null;
    port: number | null;
    priority: number | null;
    protocol: RTCIceProtocol | null;
    relatedAddress: string | null;
    relatedPort: number | null;
    sdpMLineIndex: number | null;
    sdpMid: string | null;
    tcpType: RTCIceTcpCandidateType | null;
    type: RTCIceCandidateType | null;
    usernameFragment: string | null;

    constructor(options?: RTCIceCandidateInit) {
        this.candidate = options?.candidate || "";
        this.sdpMid = options?.sdpMid || null;
        this.sdpMLineIndex = options?.sdpMLineIndex || null;
        this.usernameFragment = options?.usernameFragment || null;
    }

    toJSON(): RTCIceCandidateInit {
        throw new Error("Method not implemented.");
    }
}

export class MockRTCDataChannelImpl implements RTCDataChannel {
    binaryType: BinaryType;
    bufferedAmount: number;
    bufferedAmountLowThreshold: number;
    id: number | null;
    label: string;
    maxPacketLifeTime: number | null;
    maxRetransmits: number | null;
    negotiated: boolean;
    ordered: boolean;
    protocol: string;
    readyState: RTCDataChannelState;

    constructor() {
        this.readyState = "open";
    }

    onbufferedamountlow: ((this: RTCDataChannel, ev: Event) => any) | null;
    onclose: ((this: RTCDataChannel, ev: Event) => any) | null;
    onclosing: ((this: RTCDataChannel, ev: Event) => any) | null;
    onerror: ((this: RTCDataChannel, ev: Event) => any) | null;
    onmessage: ((this: RTCDataChannel, ev: MessageEvent<any>) => any) | null;
    onopen: ((this: RTCDataChannel, ev: Event) => any) | null;
    close(): void {
        this.onclose?.(new Event('close'));
    }
    send(data: string): void;
    send(data: Blob): void;
    send(data: ArrayBuffer): void;
    send(data: ArrayBufferView): void;
    send(data: unknown): void {
        spyFunctions.sendDataSpy?.(data as ArrayBuffer);
    }
    addEventListener<K extends keyof RTCDataChannelEventMap>(type: K, listener: (this: RTCDataChannel, ev: RTCDataChannelEventMap[K]) => any, options?: boolean | AddEventListenerOptions | undefined): void;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions | undefined): void;
    addEventListener(type: unknown, listener: unknown, options?: unknown): void {
        throw new Error("Method not implemented.");
    }
    removeEventListener<K extends keyof RTCDataChannelEventMap>(type: K, listener: (this: RTCDataChannel, ev: RTCDataChannelEventMap[K]) => any, options?: boolean | EventListenerOptions | undefined): void;
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions | undefined): void;
    removeEventListener(type: unknown, listener: unknown, options?: unknown): void {
        throw new Error("Method not implemented.");
    }
    dispatchEvent(event: Event): boolean {
        if (event.type === 'message') {
            this.onmessage?.(event as MessageEvent);
        }
        return true;
    }
}

export class MockRTCDataChannelEventImpl extends Event implements RTCDataChannelEvent {
    channel: RTCDataChannel;
    constructor(name: string, data: RTCDataChannelEventInit) {
        super(name, data);
        this.channel = data.channel;
    }
}

export class MockRTCTrackEventImpl extends Event implements RTCTrackEvent {
    receiver: RTCRtpReceiver;
    streams: readonly MediaStream[];
    track: MediaStreamTrack;
    transceiver: RTCRtpTransceiver;
    constructor(name: string, data: RTCTrackEventInit) {
        super(name, data);
        this.receiver = data.receiver;
        this.streams = data.streams || [];
        this.track = data.track;
        this.transceiver = data.transceiver;
    }
}

const originalRTCPeerConnection = global.RTCPeerConnection;
const originalRTCIceCandidate = global.RTCIceCandidate;
const originalRTCDataChannel = global.RTCDataChannel;
const originalRTCDataChannelEvent = global.RTCDataChannelEvent;
const originalRTCTrackEvent = global.RTCTrackEvent;
export const mockRTCPeerConnection = (): [
    MockRTCPeerConnectionSpyFunctions,
    MockRTCPeerConnectionTriggerFunctions
] => {
    spyFunctions.constructorSpy = jest.fn();
    spyFunctions.closeSpy = jest.fn();
    spyFunctions.setRemoteDescriptionSpy = jest.fn();
    spyFunctions.setLocalDescriptionSpy = jest.fn();
    spyFunctions.createAnswerSpy = jest.fn();
    spyFunctions.addTransceiverSpy = jest.fn();
    spyFunctions.addIceCandidateSpy = jest.fn();
    spyFunctions.sendDataSpy = jest.fn();
    global.RTCPeerConnection = MockRTCPeerConnectionImpl;
    global.RTCIceCandidate = MockRTCIceCandidateImpl;
    global.RTCDataChannel = MockRTCDataChannelImpl;
    global.RTCDataChannelEvent = MockRTCDataChannelEventImpl;
    global.RTCTrackEvent = MockRTCTrackEventImpl;
    return [spyFunctions, triggerFunctions];
};

export const unmockRTCPeerConnection = () => {
    global.RTCPeerConnection = originalRTCPeerConnection;
    global.RTCIceCandidate = originalRTCIceCandidate;
    global.RTCDataChannel = originalRTCDataChannel;
    global.RTCDataChannelEvent = originalRTCDataChannelEvent;
    global.RTCTrackEvent = originalRTCTrackEvent;
    spyFunctions.constructorSpy = null;
    spyFunctions.closeSpy = null;
    spyFunctions.setRemoteDescriptionSpy = null;
    spyFunctions.setLocalDescriptionSpy = null;
    spyFunctions.createAnswerSpy = null;
    spyFunctions.addTransceiverSpy = null;
    spyFunctions.addIceCandidateSpy = null;
    spyFunctions.sendDataSpy = null;
};
