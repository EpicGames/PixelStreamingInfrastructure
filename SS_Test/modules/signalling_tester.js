const WebSocket = require('ws');

/**
 * A signalling connection object. This is the main workhorse of the testing framework.
 * Once you tell it where to connect it will start buffering received messages and
 * allow you to send messages.
 * The idea is you can set up a bunch of expected messages for this current time using
 * addExpect and then when ready call processMessages.
 * The system will then try to resolve messages received with expected entries and call
 * the handler for each matched message.
 * If the expected list empties the stage will call the success callback and clear its
 * expects and be ready to setup again.
 * If the timeout is hit and there are still messages in the queue, unhandled expects
 * or current errors, the failed callback will be called with relevant information and
 * the system will be ready to setup again.
 * 
 * A stage test might look something like this...
 * 
 * var conn = new SignallingConnection('Testing', 'ws://localhost:80');
 * conn.setLogCallback((conn, message) => console.log(message));
 * conn.setSuccessCallback((conn) => console.log('Success!'));
 * conn.setFailureCallback((conn, errors, unsatisfiedExpects, unhandledMessages) => console.log('Failed!'));
 * 
 * conn.sendMessage({type: 'ping'});
 * conn.addExpect('pong', (msg) => console.log('Got pong: ' + JSON.stringify(msg)));
 * conn.processMessages(1000);
 */
class SignallingConnection {
    /**
     * Initialize a new connection and immediately try to connect.
     * @param name A descriptive name for this connection. Useful for reporting.
     * @param url The websocket URL to attempt a connection to.
     */
    constructor(name, url) {
        this.name = name;
        this.expectingList = [];
        this.eventQueue = [];

        this.errors = [];

        this.logCallback = (connection, message) => {};
        this.successCallback = (connection) => {};
        this.failedCallback = (connection, errors, unsatisfiedExpects, unhandledMessages) => {};

        this.logCallback(this, `Connecting to Signalling Server at ${url}`);
        this.ws = new WebSocket(url);
        this.ws.addEventListener("open", event => this.onConnectionOpen(event));
        this.ws.addEventListener("error", event => this.onConnectionError(event));
        this.ws.addEventListener("close", closeEvent => this.onConnectionClose(closeEvent));
        this.ws.addEventListener("message", messageEvent => this.onMessage(messageEvent));
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
     * @param callback A function of the form, function log(connection, message).
     */
    setLogCallback(callback) {
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
     * @param callback The callback function.
     */
    setSuccessCallback(callback) {
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
     *   errors - An array of strings representing error messages that happened this stage.
     *   unsatisfiedExpects - An array of strings listing the type of messages we expected but never received.
     *   unhandledMessages - An array of parsed JSON message objects.
     *
     * @param callback The callback function.
     */
    setFailedCallback(callback) {
        this.failedCallback = callback;
    }

    /**
     * Sends the given message to the connection immediately.
     * @param message The JSON object to send. It is stringified and sent on the connection.
     */
    sendMessage(message) {
        const str = JSON.stringify(message);
        this.logCallback(this, `Sending: ${str}`);
        this.ws.send(str);
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
     * @param messageType The message type we expect.
     * @param handler The handler to call when we read the given message type.
     */
    addExpect(messageType, handler) {
        this.expectingList.push({type: messageType, handler: handler});
    }

    /**
     * Begins the processing of messages and expects and tries to match them up until
     * the timer expires or we clear out the expected list.
     * When this resolves it will either call the success or failed callback, and then
     * clear the expects, buffered messages and errors so the system is ready to test
     * another stage.
     * @param timeout A timeout in milliseconds to wait for messages we expect until we fail.
     * @return A promise that resolves when the process completes.
     */
    async processMessages(timeout) {
        var eventQueue = this.eventQueue;
        var expectingList = this.expectingList;

        const pollingPromise = new Promise((resolve) => {
            const timeoutTimer = setTimeout(()=>{
                this.addError(`Timed out waiting to clear messages/expected after ${timeout / 1000.0}s`);
                resolve();
            }, timeout);
            async function poll() {
                var eventsToRemove = [];
                var expectingToRemove = [];
                for (var qi = 0; qi < eventQueue.length; ++qi) {
                    if (eventQueue[qi].type == 'error') {
                        addError(eventQueue[qi].data);
                        eventsToRemove.push(qi);
                    }
                    else if (eventQueue[qi].type == 'message') {
                        for (var ei = 0; ei < expectingList.length; ++ei) {
                            const message = eventQueue[qi].data;
                            const expected = expectingList[ei];
                            if (expected.type == message.type) {
                                eventsToRemove.push(qi);
                                expectingToRemove.push(ei);
                                expected.handler(message);
                            }
                        }
                    }
                    else {
                        console.error(`${this.name}: Unhandled internal event type: ${eventQueue[qi].type}`);
                        assert(false);
                    }
                }
                for (var i = eventsToRemove.length - 1; i >= 0; --i) {
                    eventQueue.splice(eventsToRemove[i], 1);
                }
                for (var i = expectingToRemove.length - 1; i >= 0; --i) {
                    expectingList.splice(expectingToRemove[i], 1);
                }

                // if we clear the expected queue we're done.
                // its possible that in handling expected messages we send other messages that trigger messages
                // to be sent that we dont expect yet. for now im going to just leave it up to the caller to
                // be mindful of when they trigger other messages to be sent.
                if (expectingList.length > 0) {
                    setTimeout(poll, 50);
                } else {
                    clearTimeout(timeoutTimer);
                    resolve();
                }
            }
            poll();
        });

        pollingPromise
            .then(() => {
                var success = true;

                if (this.errors.length > 0 || this.expectingList.length > 0 || this.eventQueue.length > 0) {
                    const unsatisfiedExpects = this.expectingList.map((expect) => expect.type);
                    const unhandledMessages = this.eventQueue.filter((event) => event.type == 'message').map((event) => event.data);
                    const errors = this.errors;
                    this.failedCallback(this, errors, unsatisfiedExpects, unhandledMessages);
                    success = false;
                } else {
                    this.successCallback(this);
                }

                this.expectingList = [];
                this.eventQueue = [];
                this.errors = [];
            });

        return pollingPromise;
    }

    // internal
    addError(error) {
        this.errors.push(error);
    }

    // intenal
    onConnectionOpen(event) {
        this.logCallback(this, `Connected to signalling server`);
    }

    // internal
    onConnectionError(event) {
        this.logCallback(this, `Signalling connection error: ${event.message}`);
    }

    // internal
    onConnectionClose(closeEvent) {
        this.logCallback(this, `Disconnected from signalling server`);
    }

    // internal
    onMessage(messageEvent) {
        const messageString = messageEvent.data;
        this.logCallback(this, `Got message: ${JSON.stringify(messageEvent.data)}`);

        var parsedMessage;
        try {
            parsedMessage = JSON.parse(messageString);
        } catch (e) {
            this.eventQueue.push({type: 'error', data: `Malformed JSON message. (${messageString})`});
            return;
        }

        if (!parsedMessage.type) {
            this.eventQueue.push({type: 'error', data: `Message has no type. (${messageString})`});
            return;
        }

        if (parsedMessage) {
            this.eventQueue.push({type: 'message', data: parsedMessage});
        }
    }
}

module.exports = SignallingConnection;
