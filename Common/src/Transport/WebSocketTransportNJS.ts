// Copyright Epic Games, Inc. All Rights Reserved.

import { ITransport } from './ITransport';
import { BaseMessage } from '../Messages/base_message';
import WebSocket from 'ws';
import { EventEmitter } from 'events';

/**
 * An implementation of WebSocketTransport from pixelstreamingcommon that supports node.js websockets
 * This is needed because of the slight differences between the 'ws' node.js package and the websockets
 * supported in the browsers.
 * If you are using this code in a browser use 'WebSocketTransport' instead.
 */
export class WebSocketTransportNJS extends EventEmitter implements ITransport {
    WS_OPEN_STATE = 1;
    webSocket: WebSocket;
    webSocketServer: WebSocket.Server;

    constructor(existingSocket?: WebSocket) {
        super();
        if (existingSocket) {
            this.webSocket = existingSocket;
            this.setupSocketHandlers();
            this.emit('open');
        }
    }

    sendMessage(msg: BaseMessage): void {
        this.webSocket.send(JSON.stringify(msg));
    }

    onMessage: (msg: BaseMessage) => void;

    /**
     * Connect to the signaling server
     * @param connectionURL - The Address of the signaling server
     * @returns - If there is a connection
     */
    connect(connectionURL: string): boolean {
        this.webSocket = new WebSocket(connectionURL);
        this.setupSocketHandlers();
        return true;
    }

    disconnect(code?: number, reason?: string): void {
        this.webSocket.close(code, reason);
    }

    isConnected(): boolean {
        return this.webSocket && this.webSocket.readyState != WebSocket.CLOSED
    }
    
    /**
     * Handles what happens when a message is received
     * @param event - Message Received
     */
    handleOnMessage(event: WebSocket.MessageEvent) {
        let parsedMessage;
        try {
            parsedMessage = JSON.parse(event.data as string);
        } catch (e) {
            return;
        }

        this.onMessage(parsedMessage);
    }

    /**
     * Handles when the Websocket is opened
     * @param event - Not Used
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handleOnOpen(event: WebSocket.Event) {
        this.emit('open', event);
    }

    /**
     * Handles when there is an error on the websocket
     * @param event - Error Payload
     */
    handleOnError(event: WebSocket.ErrorEvent) {
        this.emit('error', event);
    }

    /**
     * Handles when the Websocket is closed
     * @param event - Close Event
     */
    handleOnClose(event: WebSocket.CloseEvent) {
        this.emit('close', event);
    }

    /**
     * Closes the Websocket connection
     */
    close() {
        this.webSocket?.close();
    }

    private setupSocketHandlers() {
        this.webSocket.addEventListener("open", this.handleOnOpen.bind(this));
        this.webSocket.addEventListener("error", this.handleOnError.bind(this));
        this.webSocket.addEventListener("close", this.handleOnClose.bind(this));
        this.webSocket.addEventListener("message", this.handleOnMessage.bind(this));
    }
}
