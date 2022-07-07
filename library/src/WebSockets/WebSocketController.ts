import { Logger } from "../Logger/Logger";
import { AggregatedStats } from "../PeerConnectionController/AggregatedStats";
import * as MessageReceive from "./MessageReceive";
import * as MessageSend from "./MessageSend";

/**
 * The controller for the WebSocket and all associated methods 
 */
export class WebSocketController {
    WS_OPEN_STATE = 1;
    address: string;
    webSocket: WebSocket;

    /**
     * @param Address - The Address of the signaling server
     */
    constructor(Address: string) {
        this.address = Address;
    }

    /**
     * Connect to the signaling server
     * @returns - If there is a connection
     */
    connect(): boolean {
        Logger.verboseLog(this.address);
        try {
            this.webSocket = new WebSocket(this.address);
            this.webSocket.onopen = (event) => this.handleOnOpen(event);
            this.webSocket.onerror = (event) => this.handleOnError(event);
            this.webSocket.onclose = (event) => this.handleOnClose(event);
            this.webSocket.onmessage = (event) => this.handleOnMessage(event);
            return true;
        } catch (error) {
            console.error(error);
            return false
        }
    }

    /**
     * Handles what happens when a message is received
     * @param event - Message Received
     */
    handleOnMessage(event: MessageEvent) {
        let message: MessageReceive.MessageRecv = JSON.parse(event.data);
        Logger.verboseLog("received => \n" + JSON.stringify(JSON.parse(event.data), undefined, 4));

        switch (message.type) {
            case MessageReceive.MessageRecvTypes.AUTHENTICATION_REQUIRED: {
                Logger.verboseLog("AUTHENTICATION_REQUIRED");
                let authenticationRequired: MessageReceive.MessageAuthRequired = JSON.parse(event.data);

                let url_string = window.location.href;
                let url = new URL(url_string);

                let authRequest = new MessageSend.MessageAuthRequest(url.searchParams.get("code"), url.searchParams.get("provider"));

                this.webSocket.send(authRequest.payload());

                break;
            }
            case MessageReceive.MessageRecvTypes.AUTHENTICATION_RESPONSE: {
                Logger.verboseLog("AUTHENTICATION_RESPONSE");
                let authenticationResponse: MessageReceive.MessageAuthResponse = JSON.parse(event.data);

                this.onAuthenticationResponse(authenticationResponse);

                switch (authenticationResponse.outcome) {
                    case MessageReceive.MessageAuthResponseOutcomeType.REDIRECT: {
                        window.location.href = authenticationResponse.redirect;
                        break;
                    }
                    case MessageReceive.MessageAuthResponseOutcomeType.AUTHENTICATED: {
                        Logger.verboseLog("User is authenticated and now requesting an instance")

                        this.webSocket.send(new MessageSend.MessageRequestInstance().payload());
                        break;
                    }
                    case MessageReceive.MessageAuthResponseOutcomeType.INVALID_TOKEN: {
                        console.warn("Authentication error : Invalid Token");
                        break;
                    }
                    case MessageReceive.MessageAuthResponseOutcomeType.ERROR: {
                        console.warn("Authentication Error from server Check what you are sending");
                        break;
                    }
                    default: {
                        console.error("The Outcome Message has not been handled : this is really bad");
                        break;
                    }
                }
                break;
            }
            case MessageReceive.MessageRecvTypes.INSTANCE_STATE: {
                Logger.verboseLog("INSTANCE_STATE");
                let instanceState: MessageReceive.MessageInstanceState = JSON.parse(event.data);
                this.onInstanceStateChange(instanceState);
                break;
            }
            case MessageReceive.MessageRecvTypes.CONFIG: {
                Logger.verboseLog("CONFIG");
                let config: MessageReceive.MessageConfig = JSON.parse(event.data);
                this.onConfig(config);
                break;
            }
            case MessageReceive.MessageRecvTypes.PLAYER_COUNT: {
                Logger.verboseLog("PLAYER_COUNT");
                let playerCount: MessageReceive.MessagePlayerCount = JSON.parse(event.data);
                Logger.verboseLog("Player Count: " + (playerCount.count - 1));

                break;
            }
            case MessageReceive.MessageRecvTypes.ANSWER: {
                Logger.verboseLog("ANSWER");
                let answer: MessageReceive.MessageAnswer = JSON.parse(event.data);
                this.onWebRtcAnswer(answer);
                break;
            }
            case MessageReceive.MessageRecvTypes.ICE_CANDIDATE: {
                Logger.verboseLog("ICE_CANDIDATE");
                let iceCandidate: MessageReceive.MessageIceCandidate = JSON.parse(event.data);
                this.onIceCandidate(iceCandidate.candidate);
                break;
            }
            default: {
                console.error("Error Message type not Defined");
                break;
            }
        }
    }

    /**
     * Handles when the Websocket is opened 
     * @param event - Not Used
     */
    handleOnOpen(event: Event) {
        Logger.verboseLog("Connected to the signalling server via WebSocket");
    }

    /**
     * Handles when there is an error on the websocket
     * @param event - Error Payload
     */
    handleOnError(event: Event) {
        console.error('WebSocket error: ');
        console.log(event);
    }

    /**
     * Handles when the Websocket is closed
     * @param event - Close Event
     */
    handleOnClose(event: CloseEvent) {
        this.onWebSocketOncloseOverlayMessage(event);
        Logger.verboseLog("Disconnected to the signalling server via WebSocket: " + JSON.stringify(event.code) + " - " + event.reason);
        this.stopAfkWarningTimer();
    }

    /**
     * An override for stoping the afk warning timer
     */
    stopAfkWarningTimer(){}

    sendWebRtcOffer(offer: RTCSessionDescriptionInit) {
        let payload = new MessageSend.MessageWebRTCOffer(offer);
        this.webSocket.send(payload.payload());
    }

    /**
     * Sends an RTC Ice Candidate to the Server
     * @param candidate - RTC Ice Candidate
     */
    sendIceCandidate(candidate: RTCIceCandidate) {
        console.log("Sending Ice Candidate");
        if (this.webSocket && this.webSocket.readyState === this.WS_OPEN_STATE) {
            //ws.send(JSON.stringify({ type: 'iceCandidate', candidate: candidate }));
            let IceCandidate = new MessageSend.MessageIceCandidate(candidate);

            this.webSocket.send(IceCandidate.payload());
        }
    }

    /**
     * Closes the Websocket connection
     */
    close() {
        this.webSocket.close();
    }

    /**
     * Sends the Aggregated Stats to the signaling server
     * @param stats - Stats Payload
     */
    sendStats(stats: AggregatedStats) {
        let data = new MessageSend.MessageStats(stats);
        this.webSocket.send(data.payload());
    }

    /** Event used for Displaying websocket closed messages */
    onWebSocketOncloseOverlayMessage(event: CloseEvent) { }

    /**
     * The Message Contains the payload of the peer connection options used for the RTC Peer hand shake
     * @param messageConfig - Config Message received from he signaling server
     */
    onConfig(messageConfig: MessageReceive.MessageConfig) { }

    /**
     * @param iceCandidate - Ice Candidate sent from the Signaling server server's RTC hand shake
     */
    onIceCandidate(iceCandidate: RTCIceCandidateInit) { }

    /**
     * Event is fired when the websocket receives the answer for the RTC peer Connection
     * @param messageAnswer - The RTC Answer payload from the signaling server
     */
    onWebRtcAnswer(messageAnswer: MessageReceive.MessageAnswer) { }

    /**
     * Event fired with the websocket receives a instance state
     * @param instanceState - UE Instance State
     */
    onInstanceStateChange(instanceState: MessageReceive.MessageInstanceState) { }

    /**
     * Event fired with the websocket receives a Authentication Response
     * @param authResponse - Authentication Response
     */
    onAuthenticationResponse(authResponse: MessageReceive.MessageAuthResponse) { }
}


/* 524f4d4d */