export interface MockRTCPeerConnectionSpyFunctions {
    constructorSpy: null | ((config: RTCConfiguration) => void);
    closeSpy: null | (() => void);
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
        this.iceConnectionState = "checking";
        this.oniceconnectionstatechange?.(new Event("iceconnectionstatechange"));
        return Promise.resolve();
    }
    addTrack(track: MediaStreamTrack, ...streams: MediaStream[]): RTCRtpSender {
        throw new Error("Method not implemented.");
    }
    addTransceiver(trackOrKind: string | MediaStreamTrack, init?: RTCRtpTransceiverInit | undefined): RTCRtpTransceiver {
        throw new Error("Method not implemented.");
    }
    createAnswer(options?: RTCAnswerOptions | undefined): Promise<RTCSessionDescriptionInit>;
    createAnswer(successCallback: RTCSessionDescriptionCallback, failureCallback: RTCPeerConnectionErrorCallback): Promise<void>;
    createAnswer(successCallback?: unknown, failureCallback?: unknown): Promise<void> | Promise<RTCSessionDescriptionInit> {
        throw new Error("Method not implemented.");
    }
    createDataChannel(label: string, dataChannelDict?: RTCDataChannelInit | undefined): RTCDataChannel {
        throw new Error("Method not implemented.");
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
        throw new Error("Method not implemented.");
    }
    getTransceivers(): RTCRtpTransceiver[] {
        throw new Error("Method not implemented.");
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
        throw new Error("Method not implemented.");
    }
    setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void>;
    setRemoteDescription(description: RTCSessionDescriptionInit, successCallback: VoidFunction, failureCallback: RTCPeerConnectionErrorCallback): Promise<void>;
    setRemoteDescription(description: unknown, successCallback?: unknown, failureCallback?: unknown): Promise<void> {
        throw new Error("Method not implemented.");
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
        spyFunctions.closeSpy?.();
    }

    // send(data: string | Blob | ArrayBufferView | ArrayBufferLike): void {
    //     spyFunctions.sendSpy?.(data);
    // }

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
        const event = new RTCDataChannelEvent('icecandidate', data);
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

const originalRTCPeerConnection = global.RTCPeerConnection;
const originalRTCIceCandidate = global.RTCIceCandidate;
export const mockRTCPeerConnection = (): [
    MockRTCPeerConnectionSpyFunctions,
    MockRTCPeerConnectionTriggerFunctions
] => {
    spyFunctions.constructorSpy = jest.fn();
    spyFunctions.closeSpy = jest.fn();
    global.RTCPeerConnection = MockRTCPeerConnectionImpl;
    global.RTCIceCandidate = MockRTCIceCandidateImpl;
    return [spyFunctions, triggerFunctions];
};

export const unmockRTCPeerConnection = () => {
    global.RTCPeerConnection = originalRTCPeerConnection;
    global.RTCIceCandidate = originalRTCIceCandidate;
    spyFunctions.constructorSpy = null;
    spyFunctions.closeSpy = null;
};
