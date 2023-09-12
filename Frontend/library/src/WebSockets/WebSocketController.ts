// Copyright Epic Games, Inc. All Rights Reserved.

import { Logger } from '../Logger/Logger';
import * as MessageReceive from './MessageReceive';
import * as MessageSend from './MessageSend';
import { SignallingProtocol } from './SignallingProtocol';

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
    webSocket: WebSocket;
    onOpen: EventTarget;
    onClose: EventTarget;
    signallingProtocol: SignallingProtocol;

    constructor() {
        this.onOpen = new EventTarget();
        this.onClose = new EventTarget();
        this.signallingProtocol = new SignallingProtocol();
        SignallingProtocol.setupDefaultHandlers(this);
    }

    /**
     * Connect to the signaling server
     * @param connectionURL - The Address of the signaling server
     * @returns - If there is a connection
     */
    connect(connectionURL: string): boolean {
        Logger.Log(Logger.GetStackTrace(), connectionURL, 6);
        try {
            this.webSocket = new WebSocket(connectionURL);
            this.webSocket.onopen = (event) => this.handleOnOpen(event);
            this.webSocket.onerror = () => this.handleOnError();
            this.webSocket.onclose = (event) => this.handleOnClose(event);
            this.webSocket.onmessage = (event) => this.handleOnMessage(event);
            this.webSocket.onmessagebinary = (event) =>
                this.handleOnMessageBinary(event);
            return true;
        } catch (error) {
            Logger.Error(error, error);
            return false;
        }
    }

    /**
     * Handles what happens when a message is received in binary form
     * @param event - Message Received
     */
    handleOnMessageBinary(event: MessageEvent) {
        // if the event is empty return
        if (!event || !event.data) {
            return;
        }

        // handle the binary and then handle the message
        event.data
            .text()
            .then((messageString: unknown) => {
                // build a new message
                const constructedMessage = new MessageEvent(
                    'messageFromBinary',
                    {
                        data: messageString
                    }
                );

                // send the new stringified event back into `onmessage`
                this.handleOnMessage(constructedMessage);
            })
            .catch((error: Error) => {
                Logger.Error(
                    Logger.GetStackTrace(),
                    `Failed to parse binary blob from websocket, reason: ${error}`
                );
            });
    }

    /**
     * Handles what happens when a message is received
     * @param event - Message Received
     */
    handleOnMessage(event: MessageEvent) {
        // Check if websocket message is binary, if so, stringify it.
        if (event.data && event.data instanceof Blob) {
            this.handleOnMessageBinary(event);
            return;
        }

        const message: MessageReceive.MessageRecv = JSON.parse(event.data);
        Logger.Log(
            Logger.GetStackTrace(),
            'received => \n' +
                JSON.stringify(JSON.parse(event.data), undefined, 4),
            6
        );

        // Send to our signalling protocol to handle the incoming message
        this.signallingProtocol.handleMessage(message.type, event.data);
    }

    /**
     * Handles when the Websocket is opened
     * @param event - Not Used
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handleOnOpen(event: Event) {
        Logger.Log(
            Logger.GetStackTrace(),
            'Connected to the signalling server via WebSocket',
            6
        );
        this.onOpen.dispatchEvent(new Event('open'));
    }

    /**
     * Handles when there is an error on the websocket
     * @param event - Error Payload
     */
    handleOnError() {
        Logger.Error(Logger.GetStackTrace(), 'WebSocket error');
    }

    /**
     * Handles when the Websocket is closed
     * @param event - Close Event
     */
    handleOnClose(event: CloseEvent) {
        this.onWebSocketOncloseOverlayMessage(event);
        Logger.Log(
            Logger.GetStackTrace(),
            'Disconnected to the signalling server via WebSocket: ' +
                JSON.stringify(event.code) +
                ' - ' +
                event.reason
        );
        this.onClose.dispatchEvent(new CustomEvent('close', { 'detail': event }));
    }

    requestStreamerList() {
        const payload = new MessageSend.MessageListStreamers();
        this.webSocket.send(payload.payload());
    }

    sendSubscribe(streamerid: string) {
        const payload = new MessageSend.MessageSubscribe(streamerid);
        this.webSocket.send(payload.payload());
    }

    sendUnsubscribe() {
        const payload = new MessageSend.MessageUnsubscribe();
        this.webSocket.send(payload.payload());
    }

    sendWebRtcOffer(offer: RTCSessionDescriptionInit) {
        const payload = new MessageSend.MessageWebRTCOffer(offer);
        this.webSocket.send(payload.payload());
    }

    sendWebRtcAnswer(answer: RTCSessionDescriptionInit) {
        const payload = new MessageSend.MessageWebRTCAnswer(answer);
        this.webSocket.send(payload.payload());
    }

    sendWebRtcDatachannelRequest() {
        const payload = new MessageSend.MessageWebRTCDatachannelRequest();
        this.webSocket.send(payload.payload());
    }

    sendSFURecvDataChannelReady() {
        const payload = new MessageSend.MessageSFURecvDataChannelReady();
        this.webSocket.send(payload.payload());
    }

    /**
     * Sends an RTC Ice Candidate to the Server
     * @param candidate - RTC Ice Candidate
     */
    sendIceCandidate(candidate: RTCIceCandidate) {
        Logger.Log(Logger.GetStackTrace(), 'Sending Ice Candidate');
        if (
            this.webSocket &&
            this.webSocket.readyState === this.WS_OPEN_STATE
        ) {
            //ws.send(JSON.stringify({ type: 'iceCandidate', candidate: candidate }));
            const IceCandidate = new MessageSend.MessageIceCandidate(candidate);

            this.webSocket.send(IceCandidate.payload());
        }
    }

    /**
     * Closes the Websocket connection
     */
    close() {
        this.webSocket?.close();
    }

    /** Event used for Displaying websocket closed messages */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    onWebSocketOncloseOverlayMessage(event: CloseEvent) {}

    /**
     * The Message Contains the payload of the peer connection options used for the RTC Peer hand shake
     * @param messageConfig - Config Message received from he signaling server
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    onConfig(messageConfig: MessageReceive.MessageConfig) {}

    /**
     * The Message Contains the payload of the peer connection options used for the RTC Peer hand shake
     * @param messageConfig - Config Message received from he signaling server
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    onStreamerList(messageStreamerList: MessageReceive.MessageStreamerList) {}

    /**
     * @param iceCandidate - Ice Candidate sent from the Signaling server server's RTC hand shake
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    onIceCandidate(iceCandidate: RTCIceCandidateInit) {}

    /**
     * Event is fired when the websocket receives the answer for the RTC peer Connection
     * @param messageAnswer - The RTC Answer payload from the signaling server
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    onWebRtcAnswer(messageAnswer: MessageReceive.MessageAnswer) {}

    /**
     * Event is fired when the websocket receives the offer for the RTC peer Connection
     * @param messageOffer - The sdp offer
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    onWebRtcOffer(messageOffer: MessageReceive.MessageOffer) {}

    /**
     * Event is fired when the websocket receives the data channels for the RTC peer Connection from the SFU
     * @param messageDataChannels - The data channels details
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    onWebRtcPeerDataChannels(messageDataChannels: MessageReceive.MessagePeerDataChannels) {}

    /**
     * Event is fired when the websocket receives the an updated player count from cirrus
     * @param MessagePlayerCount - The new player count
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    onPlayerCount(playerCount: MessageReceive.MessagePlayerCount) {}
}
