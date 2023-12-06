import WebSocket from 'ws';

export interface ExpectedMessage {
    type: 'message';
    messageType: string;
    handler: (message: any) => void;
}

export interface ExpectedEvent {
    type: 'socket';
    eventType: string;
    handler: (message: WebSocket.Event) => void;
}

export interface MessageEvent {
    type: 'message';
    message: any;
}

export interface SocketEvent {
    type: 'socket';
    eventType: string;
    event: any;
}

export interface ErrorEvent {
    type: 'error';
    message: string;
}

export type Expected = ExpectedMessage | ExpectedEvent;
export type Event = MessageEvent | SocketEvent | ErrorEvent;

type LogCallback = (connection: SignallingConnection, message: string) => void;
type SuccessCallback = (connection: SignallingConnection) => void;
type FailedCallback = (connection: SignallingConnection, unsatisfiedExpects: Expected[], unhandledEvents: Event[]) => void;

/**
 * A signalling connection object.
 * This is the main workhorse of the testing framework. Once you tell it where
 * to connect it will start buffering received messages and allow you to send
 * messages. The idea is you can set up a bunch of expected messages for this
 * current time using addExpect and then when ready call processMessages. The
 * system will then try to resolve messages received with expected entries and
 * call the handler for each matched message.
 * If the expected list empties the stage will call the success callback and
 * clear its expects and be ready to setup again.
 * If the timeout is hit and there are still messages in the queue, unhandled
 * expects or current errors, the failed callback will be called with relevant
 * information and the system will be ready to setup again.
 * 
 * A stage test might look something like this...
 * 
 * var conn = new SignallingConnection('Testing', 'ws://localhost:80');
 * conn.setLogCallback((conn, message) => console.log(message));
 * conn.setSuccessCallback((conn) => console.log('Success!'));
 * conn.setFailureCallback((conn, unsatisfiedExpects, unhandledMessages) => console.log('Failed!'));
 * 
 * conn.addEventExpect('open', (event) => {});
 * conn.sendMessage({type: 'ping'});
 * conn.addExpect('pong', (msg) => console.log('Got pong: ' + JSON.stringify(msg)));
 * conn.processMessages(1000);
 */
export class SignallingConnection {
    private _name: string;
    private expectingList: Expected[];
    private eventQueue: Event[];
    private logCallback: LogCallback;
    private successCallback: SuccessCallback;
    private failedCallback: FailedCallback;
    private ws: WebSocket;
    private processTimer: ReturnType<typeof setTimeout> | null;

    /**
     * Initialize a new connection and immediately try to connect.
     * @param name - A descriptive name for this connection. Useful for reporting.
     * @param url - The websocket URL to attempt a connection to.
     */
    constructor(name: string, url: string) {
        this._name = name;
        this.expectingList = [];
        this.eventQueue = [];
        this.logCallback = (connection, message) => {};
        this.successCallback = (connection) => {};
        this.failedCallback = (connection, unsatisfiedExpects, unhandledEvents) => {};
        this.processTimer = null;

        this.logCallback(this, `Connecting to Signalling Server at ${url}`);
        this.ws = new WebSocket(url);
        this.ws.addEventListener("open", event => this.onConnectionOpen(event));
        this.ws.addEventListener("error", event => this.onConnectionError(event));
        this.ws.addEventListener("close", event => this.onConnectionClose(event));
        this.ws.addEventListener("message", event => this.onMessage(event));
    }

    /**
     * Gets the descriptive name of this connection.
     * @returns The descriptive name of this connection.
     */
    get name(): string {
        return this._name;
    }

    /**
     * Sets a callback to be used for general logging messages. Realtime websocket events etc.
     * The callback has the signature...
     * 
     * function callback(connection, message)
     * 
     * where
     *   connection - This connection.
     *   message - The log message as a string.
     * 
     * @param callback - A function of the form, function log(connection, message).
     */
    setLogCallback(callback: LogCallback) {
        this.logCallback = callback;
    }

    /**
     * Sets a callback to be called when processMessages completes successfully.
     * The callback has the signature...
     * 
     * function callback(connection)
     * 
     * where
     *   connection - This connection.
     * 
     * @param callback - The callback function.
     */
    setSuccessCallback(callback: SuccessCallback) {
        this.successCallback = callback;
    }

    /**
     * Sets a callback to be called when processMessages completes with failures.
     * The callback has the signature...
     * 
     * function callback(connection, errors, unsatisfiedExpects, unhandledMessages)
     * 
     * where
     *   connection - This connection.
     *   unsatisfiedExpects - An array of Expected objects listing the type of messages we expected but never received.
     *   unhandledEvents - An array of Event objects unhandled.
     *
     * @param callback - The callback function.
     */
    setFailedCallback(callback: FailedCallback) {
        this.failedCallback = callback;
    }

    /**
     * Sends the given message to the connection immediately.
     * @param message - The JSON object to send. It is stringified and sent on the connection.
     */
    sendMessage(message: any) {
        const str = JSON.stringify(message);
        this.logCallback(this, `Sending: ${str}`);
        this.ws.send(str);
    }

    /**
     * Adds an expected socket event and its handler to the current list.
     * The handler has the signature...
     * 
     * function handler(event)
     * 
     * where
     *   event - The websocket event object associated with the matched event.
     * 
     * @param eventType - The message type we expect.
     * @param handler - The handler to call when we read the given message type.
     */
    addEventExpect(eventType: string, handler: (event: WebSocket.Event) => void) {
        this.expectingList.push({type: 'socket', eventType: eventType, handler: handler});
    }

    /**
     * Adds an expected message and its handler to the current list.
     * The handler has the signature...
     * 
     * function handler(message)
     * 
     * where
     *   message - The JSON object of the message that matched the type.
     * 
     * @param messageType - The message type we expect.
     * @param handler - The handler to call when we read the given message type.
     */
    addExpect(messageType: string, handler: (message: any) => void) {
        this.expectingList.push({type: 'message', messageType: messageType, handler: handler});
    }

    /**
     * Begins the processing of messages and expects and tries to match them up until
     * the timer expires or we clear out the expected list.
     * When this resolves it will either call the success or failed callback, and then
     * clear the expects, buffered messages and errors so the system is ready to test
     * another stage.
     * @param timeout - A timeout in milliseconds to wait for messages we expect until we fail.
     * @returns A promise that resolves when the process completes.
     */
    async processMessages(timeout: number) {
        const pollingPromise = new Promise<void>((resolve) => {
            this.processTimer = setTimeout(()=>{
                this.addError(`Timed out waiting to clear messages/expected after ${timeout / 1000.0}s`);
                resolve();
            }, timeout);

            this.poll(resolve);
        });

        pollingPromise
            .then(() => {
                var success = true;

                if (this.expectingList.length > 0 || this.eventQueue.length > 0) {
                    const unsatisfiedExpects = this.expectingList;
                    const unhandledEvents = this.eventQueue;
                    this.failedCallback(this, unsatisfiedExpects, unhandledEvents);
                    success = false;
                } else {
                    this.successCallback(this);
                }

                this.expectingList = [];
                this.eventQueue = [];
            });

        return pollingPromise;
    }

    /**
     * Close the connection.
     * @param code - The code to send with the close.
     * @param message - The message to send with the close.
     */
    close(code: number, message: string) {
        this.ws.close(code, message);
    }

    private addError(error: string) {
        this.eventQueue.push({type: 'error', message: error});
    }

    private onConnectionOpen(event: WebSocket.Event) {
        this.logCallback(this, `Connected to signalling server`);
        this.eventQueue.push({type: 'socket', eventType: 'open', event: event});
    }

    private onConnectionError(event: WebSocket.ErrorEvent) {
        this.logCallback(this, `Signalling connection error: ${event.error} (${event.message})`);
        this.eventQueue.push({type: 'socket', eventType: 'error', event: event});
    }

    private onConnectionClose(event: WebSocket.CloseEvent) {
        this.logCallback(this, `Disconnected from signalling server: ${event.reason} (${event.code})`);
        this.eventQueue.push({type: 'socket', eventType: 'close', event: event});
    }

    private onMessage(event: WebSocket.MessageEvent) {
        const messageString = event.data as string;
        this.logCallback(this, `Got message: ${JSON.stringify(event.data)}`);

        var parsedMessage;
        try {
            parsedMessage = JSON.parse(messageString);
        } catch (e) {
            this.eventQueue.push({type: 'error', message: `Malformed JSON message. (${messageString})`});
            return;
        }

        if (!parsedMessage.type) {
            this.eventQueue.push({type: 'error', message: `Message has no type. (${messageString})`});
            return;
        }

        if (parsedMessage) {
            this.eventQueue.push({type: 'message', message: parsedMessage});
        }
    }

    private async poll(resolve: () => void) {
        var eventsToRemove = [];
        var expectingToRemove = [];
        for (var qi = 0; qi < this.eventQueue.length; ++qi) {
            if (this.eventQueue[qi].type == 'error') {
                const errorEvent = this.eventQueue[qi] as ErrorEvent;
                this.addError(errorEvent.message);
                eventsToRemove.push(qi);
            }
            else if (this.eventQueue[qi].type == 'message') {
                const messageEvent = this.eventQueue[qi] as MessageEvent;
                for (var ei = 0; ei < this.expectingList.length; ++ei) {
                    const message = messageEvent.message;
                    const expected = this.expectingList[ei];
                    if (expected.type == 'message' && expected.messageType == message.type) {
                        eventsToRemove.push(qi);
                        expectingToRemove.push(ei);
                        expected.handler(message);
                    }
                }
            }
            else if (this.eventQueue[qi].type == 'socket') {
                const socketEvent = this.eventQueue[qi] as SocketEvent;
                for (var ei = 0; ei < this.expectingList.length; ++ei) {
                    const expected = this.expectingList[ei];
                    if (expected.type == 'socket' && expected.eventType == socketEvent.eventType) {
                        eventsToRemove.push(qi);
                        expectingToRemove.push(ei);
                        expected.handler(socketEvent.event);
                    }
                }
            }
            else {
                console.error(`${this.name}: Unhandled internal event type: ${this.eventQueue[qi].type}`);
                throw new Error('Unhandled internal event type');
            }
        }
        for (var i = eventsToRemove.length - 1; i >= 0; --i) {
            this.eventQueue.splice(eventsToRemove[i], 1);
        }
        for (var i = expectingToRemove.length - 1; i >= 0; --i) {
            this.expectingList.splice(expectingToRemove[i], 1);
        }

        if (this.expectingList.length > 0) {
            setTimeout(() => { this.poll(resolve); }, 50);
        } else {
            if (this.processTimer != null) {
                clearTimeout(this.processTimer);
            }
            resolve();
        }
    }
}
