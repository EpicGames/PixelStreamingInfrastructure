import { Logger } from "../Logger/Logger";
import { AggregatedStats } from "../PeerConnectionController/AggregatedStats";
import * as MessageReceive from "./MessageReceive";
import * as MessageSend from "./MessageSend";

// declare the new method for the websocket interface
declare global {
    interface WebSocket {
        onmessagebinary?(event?: MessageEvent): void;
    }
}

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
        Logger.Log(Logger.GetStackTrace(), this.address, 6);
        try {
            this.webSocket = new WebSocket(this.address);
            this.webSocket.onopen = (event) => this.handleOnOpen(event);
            this.webSocket.onerror = (event) => this.handleOnError(event);
            this.webSocket.onclose = (event) => this.handleOnClose(event);
            this.webSocket.onmessage = (event) => this.handleOnMessage(event);
            this.webSocket.onmessagebinary = (event) => this.handelOnMessageBinary(event);
            return true;
        } catch (error) {
            Logger.Error(error, error);
            return false
        }
    }

    /**
     * Handles what happens when a message is received in binary form
     * @param event - Message Received
     */
    handelOnMessageBinary(event: MessageEvent) {
        // if the event is empty return
        if (!event || !event.data) {
            return;
        }

        // handel the binary and then handel the message
        event.data.text().then((messageString: any) => {

            // build a new message
            let constructedMessage = new MessageEvent('messageFromBinary', {
                data: messageString
            });

            // send the new stringified event back into `onmessage`
            this.handelOnMessageBinary(constructedMessage);

        }).catch((error: Error) => {
            Logger.Error(Logger.GetStackTrace(), `Failed to parse binary blob from websocket, reason: ${error}`);
        });
    }

    /**
     * Handles what happens when a message is received
     * @param event - Message Received
     */
    handleOnMessage(event: MessageEvent) {

        // Check if websocket message is binary, if so, stringify it.
        if (event.data && event.data instanceof Blob) {
            this.handelOnMessageBinary(event);
            return;
        }

        const message: MessageReceive.MessageRecv = JSON.parse(event.data);
        Logger.Log(Logger.GetStackTrace(), "received => \n" + JSON.stringify(JSON.parse(event.data), undefined, 4), 6);

        switch (message.type) {
            case MessageReceive.MessageRecvTypes.PING: {

                // send our pong payload back to the signalling server
                const payload = new MessageSend.MessagePong(new Date().getTime()).payload()
                Logger.Log(Logger.GetStackTrace(), MessageReceive.MessageRecvTypes.PING + ": " + payload, 6);
                this.webSocket.send(payload)

                break;
            }
            case MessageReceive.MessageRecvTypes.AUTHENTICATION_REQUIRED: {
                Logger.Log(Logger.GetStackTrace(), "AUTHENTICATION_REQUIRED", 6);
                //const authenticationRequired: MessageReceive.MessageAuthRequired = JSON.parse(event.data);
                const url_string = window.location.href;
                const url = new URL(url_string);
                const authRequest = new MessageSend.MessageAuthRequest(url.searchParams.get("code"), url.searchParams.get("provider"));
                this.webSocket.send(authRequest.payload());

                break;
            }
            case MessageReceive.MessageRecvTypes.AUTHENTICATION_RESPONSE: {
                Logger.Log(Logger.GetStackTrace(), "AUTHENTICATION_RESPONSE", 6);
                const authenticationResponse: MessageReceive.MessageAuthResponse = JSON.parse(event.data);

                this.onAuthenticationResponse(authenticationResponse);

                switch (authenticationResponse.outcome) {
                    case MessageReceive.MessageAuthResponseOutcomeType.REDIRECT: {
                        window.location.href = authenticationResponse.redirect;
                        break;
                    }
                    case MessageReceive.MessageAuthResponseOutcomeType.AUTHENTICATED: {
                        Logger.Log(Logger.GetStackTrace(), "User is authenticated and now requesting an instance", 6);

                        this.webSocket.send(new MessageSend.MessageRequestInstance().payload());
                        break;
                    }
                    case MessageReceive.MessageAuthResponseOutcomeType.INVALID_TOKEN: {
                        Logger.Info(Logger.GetStackTrace(), "Authentication error : Invalid Token");
                        break;
                    }
                    case MessageReceive.MessageAuthResponseOutcomeType.ERROR: {
                        Logger.Info(Logger.GetStackTrace(), "Authentication Error from server Check what you are sending");
                        break;
                    }
                    default: {
                        Logger.Error(Logger.GetStackTrace(), "The Outcome Message has not been handled : this is really bad");
                        break;
                    }
                }
                break;
            }
            case MessageReceive.MessageRecvTypes.INSTANCE_STATE: {
                Logger.Log(Logger.GetStackTrace(), "INSTANCE_STATE", 6);
                const instanceState: MessageReceive.MessageInstanceState = JSON.parse(event.data);
                this.onInstanceStateChange(instanceState);
                break;
            }
            case MessageReceive.MessageRecvTypes.CONFIG: {
                Logger.Log(Logger.GetStackTrace(), "CONFIG", 6);
                const config: MessageReceive.MessageConfig = JSON.parse(event.data);
                this.onConfig(config);
                break;
            }
            case MessageReceive.MessageRecvTypes.PLAYER_COUNT: {
                Logger.Log(Logger.GetStackTrace(), "PLAYER_COUNT", 6);
                const playerCount: MessageReceive.MessagePlayerCount = JSON.parse(event.data);
                Logger.Log(Logger.GetStackTrace(), "Player Count: " + (playerCount.count - 1), 6);

                break;
            }
            case MessageReceive.MessageRecvTypes.ANSWER: {
                Logger.Log(Logger.GetStackTrace(), "ANSWER", 6);
                const answer: MessageReceive.MessageAnswer = JSON.parse(event.data);
                this.onWebRtcAnswer(answer);
                break;
            }
            case MessageReceive.MessageRecvTypes.OFFER: {
                Logger.Log(Logger.GetStackTrace(), "OFFER", 6);
                const offer: MessageReceive.MessageOffer = JSON.parse(event.data);
                this.onWebRtcOffer(offer);
                break;
            }
            case MessageReceive.MessageRecvTypes.ICE_CANDIDATE: {
                Logger.Log(Logger.GetStackTrace(), "ICE_CANDIDATE", 6);
                const iceCandidate: MessageReceive.MessageIceCandidate = JSON.parse(event.data);
                this.onIceCandidate(iceCandidate.candidate);
                break;
            }
            default: {
                Logger.Error(Logger.GetStackTrace(), `Error Message type of ${message.type} not defined.`);
                break;
            }
        }
    }

    /**
     * Handles when the Websocket is opened 
     * @param event - Not Used
     */
    handleOnOpen(event: Event) {
        Logger.Log(Logger.GetStackTrace(), "Connected to the signalling server via WebSocket", 6);
    }

    /**
     * Handles when there is an error on the websocket
     * @param event - Error Payload
     */
    handleOnError(event: Event) {
        Logger.Error(Logger.GetStackTrace(), 'WebSocket error: ');
        Logger.Log(Logger.GetStackTrace(), event.toString());
    }

    /**
     * Handles when the Websocket is closed
     * @param event - Close Event
     */
    handleOnClose(event: CloseEvent) {
        this.onWebSocketOncloseOverlayMessage(event);
        Logger.Log(Logger.GetStackTrace(), "Disconnected to the signalling server via WebSocket: " + JSON.stringify(event.code) + " - " + event.reason);
        this.stopAfkWarningTimer();
    }

    /**
     * An override for stopping the afk warning timer
     */
    stopAfkWarningTimer() { }

    sendWebRtcOffer(offer: RTCSessionDescriptionInit) {
        let payload = new MessageSend.MessageWebRTCOffer(offer);
        this.webSocket.send(payload.payload());
    }

    /**
     * Sends an RTC Ice Candidate to the Server
     * @param candidate - RTC Ice Candidate
     */
    sendIceCandidate(candidate: RTCIceCandidate) {
        Logger.Log(Logger.GetStackTrace(), "Sending Ice Candidate");
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
     * Event is fired when the websocket receives the offer for the RTC peer Connection
     * @param messageOffer - The sdp offer
     */
    onWebRtcOffer(messageOffer: MessageReceive.MessageOffer) { }

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