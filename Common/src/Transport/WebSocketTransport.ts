// Copyright Epic Games, Inc. All Rights Reserved.

import { Logger } from '../Logger/Logger';
import { ITransport } from './ITransport';
import { EventEmitter } from 'events';
import { BaseMessage } from '../Messages/base_message';

// declare the new method for the websocket interface
declare global {
    interface WebSocket {
        onmessagebinary?(event?: MessageEvent): void;
    }
}

/**
 * The controller for the WebSocket and all associated methods
 */
export class WebSocketTransport extends EventEmitter implements ITransport {
    WS_OPEN_STATE = 1;
    webSocket: WebSocket;

    constructor() {
        super();
    }

    /**
     * Sends a message over the websocket.
     * @param msg - The message to send.
     */
    sendMessage(msg: BaseMessage): void {
        this.webSocket.send(JSON.stringify(msg));
    }

    // A handler for when messages are received.
    onMessage: (msg: BaseMessage) => void;

    /**
     * Connect to the signaling server
     * @param connectionURL - The Address of the signaling server
     * @returns If there is a connection
     */
    connect(connectionURL: string): boolean {
        Logger.Log(Logger.GetStackTrace(), connectionURL, 6);
        try {
            this.webSocket = new WebSocket(connectionURL);
            this.webSocket.onopen = (_: Event) => this.handleOnOpen();
            this.webSocket.onerror = (_: Event) => this.handleOnError();
            this.webSocket.onclose = (event: CloseEvent) => this.handleOnClose(event);
            this.webSocket.onmessage = (event: MessageEvent) => this.handleOnMessage(event);
            this.webSocket.onmessagebinary = (event: MessageEvent) => this.handleOnMessageBinary(event);
            return true;
        } catch (error) {
            Logger.Error(error, error);
            return false;
        }
    }

    /**
     * Disconnect this transport.
     * @param code - An optional disconnect code.
     * @param reason - A descriptive string for the disconnect reason.
     */
    disconnect(code?: number, reason?: string): void {
        this.webSocket.close(code, reason);
    }

    /**
     * Should return true when the transport is connected and ready to send/receive messages.
     * @returns True if the transport is connected.
     */
    isConnected(): boolean {
        return this.webSocket && this.webSocket.readyState != WebSocket.CLOSED
    }
    
    /**
     * Handles what happens when a message is received in binary form
     * @param event - Message Received
     */
    handleOnMessageBinary(event: MessageEvent): void {
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
    handleOnMessage(event: MessageEvent): void {
        // Check if websocket message is binary, if so, stringify it.
        if (event.data && event.data instanceof Blob) {
            this.handleOnMessageBinary(event);
            return;
        }

        Logger.Log(
            Logger.GetStackTrace(),
            'received => \n' +
                JSON.stringify(JSON.parse(event.data), undefined, 4),
            6
        );

        let parsedMessage;
        try {
            parsedMessage = JSON.parse(event.data);
        } catch (e) {
            Logger.Error(Logger.GetStackTrace(), `Error parsing message string ${event.data}.\n${e}`);
            return;
        }

        this.onMessage(parsedMessage);
    }

    /**
     * Handles when the Websocket is opened
     */
    handleOnOpen(): void {
        Logger.Log(
            Logger.GetStackTrace(),
            'Connected to the signalling server via WebSocket',
            6
        );
        this.emit('open');
    }

    /**
     * Handles when there is an error on the websocket
     */
    handleOnError(): void {
        //Logger.Error(Logger.GetStackTrace(), 'WebSocket error');
        this.emit('error');
    }

    /**
     * Handles when the Websocket is closed
     * @param event - Close Event
     */
    handleOnClose(event: CloseEvent): void {
        Logger.Log(
            Logger.GetStackTrace(),
            'Disconnected to the signalling server via WebSocket: ' +
                JSON.stringify(event.code) +
                ' - ' +
                event.reason
        );
        this.emit('close', event);
    }

    /**
     * Closes the Websocket connection
     */
    close(): void {
        this.webSocket?.close();
    }
}
