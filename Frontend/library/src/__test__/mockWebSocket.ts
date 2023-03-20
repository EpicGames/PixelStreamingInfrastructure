export interface MockWebSocketSpyFunctions {
    constructorSpy: null | ((url: string) => void);
    openSpy: null | ((event: Event) => void);
    errorSpy: null | ((event: Event) => void);
    closeSpy: null | ((event: CloseEvent) => void);
    messageSpy: null | ((event: MessageEvent) => void);
    messageBinarySpy: null | ((event: MessageEvent) => void);
    sendSpy: null | ((data: string | Blob | ArrayBufferView | ArrayBufferLike) => void);
}

export interface MockWebSocketTriggerFunctions {
    triggerOnOpen: null | (() => void);
    triggerOnError: null | (() => void);
    triggerOnClose: null | ((closeReason?: CloseEventInit) => void);
    triggerOnMessage: null | ((message?: object) => void);
    triggerOnMessageBinary: null | ((message?: Blob) => void);
}

const spyFunctions: MockWebSocketSpyFunctions = {
    constructorSpy: null,
    openSpy: null,
    errorSpy: null,
    closeSpy: null,
    messageSpy: null,
    messageBinarySpy: null,
    sendSpy: null
};

const triggerFunctions: MockWebSocketTriggerFunctions = {
    triggerOnOpen: null,
    triggerOnError: null,
    triggerOnClose: null,
    triggerOnMessage: null,
    triggerOnMessageBinary: null
};

export class MockWebSocketImpl extends WebSocket {
    _readyState: number;

    constructor(url: string | URL, protocols?: string | string[]) {
        super(url, protocols);
        this._readyState = this.OPEN;
        spyFunctions.constructorSpy?.(this.url);
        triggerFunctions.triggerOnOpen = this.triggerOnOpen.bind(this);
        triggerFunctions.triggerOnError = this.triggerOnError.bind(this);
        triggerFunctions.triggerOnClose = this.triggerOnClose.bind(this);
        triggerFunctions.triggerOnMessage = this.triggerOnMessage.bind(this);
        triggerFunctions.triggerOnMessageBinary =
            this.triggerOnMessageBinary.bind(this);
    }

    get readyState() {
        return this._readyState;
    }

    close(code?: number | undefined, reason?: string | undefined): void {
        super.close(code, reason);
        this._readyState = this.CLOSED;
        this.triggerOnClose({ code, reason });
    }

    send(data: string | Blob | ArrayBufferView | ArrayBufferLike): void {
        spyFunctions.sendSpy?.(data);
    }

    triggerOnOpen() {
        const event = new Event('open');
        this.onopen?.(event);
        spyFunctions.openSpy?.(event);
    }

    triggerOnError() {
        const event = new Event('error');
        this.onerror?.(event);
        spyFunctions.errorSpy?.(event);
    }

    triggerOnClose(closeReason?: CloseEventInit) {
        const reason = closeReason ?? { code: 1, reason: 'mock reason' };
        const event = new CloseEvent('close', reason);
        this.onclose?.(event);
        spyFunctions.closeSpy?.(event);
    }

    triggerOnMessage(message?: object) {
        const data = message
            ? JSON.stringify(message)
            : JSON.stringify({ type: 'test' });
        const event = new MessageEvent('message', { data });
        this.onmessage?.(event);
        spyFunctions.messageSpy?.(event);
    }

    triggerOnMessageBinary(message?: Blob) {
        const data =
            message ??
            new Blob([JSON.stringify({ type: 'test' })], {
                type: 'application/json'
            });
        const event = new MessageEvent('messagebinary', { data });
        this.onmessagebinary?.(event);
        spyFunctions.messageBinarySpy?.(event);
    }
}

const originalWebSocket = WebSocket;
export const mockWebSocket = (): [
    MockWebSocketSpyFunctions,
    MockWebSocketTriggerFunctions
] => {
    spyFunctions.constructorSpy = jest.fn();
    spyFunctions.openSpy = jest.fn();
    spyFunctions.errorSpy = jest.fn();
    spyFunctions.closeSpy = jest.fn();
    spyFunctions.messageSpy = jest.fn();
    spyFunctions.messageBinarySpy = jest.fn();
    spyFunctions.sendSpy = jest.fn();
    global.WebSocket = MockWebSocketImpl;
    return [spyFunctions, triggerFunctions];
};

export const unmockWebSocket = () => {
    global.WebSocket = originalWebSocket;
    spyFunctions.constructorSpy = null;
    spyFunctions.openSpy = null;
    spyFunctions.errorSpy = null;
    spyFunctions.closeSpy = null;
    spyFunctions.messageSpy = null;
    spyFunctions.messageBinarySpy = null;
};
