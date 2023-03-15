export interface MockWebSocketSpyFunctions {
    constructorSpy: null | ((url: string) => void);
    openSpy: null | ((event: Event) => void);
    errorSpy: null | ((event: Event) => void);
    closeSpy: null | ((event: CloseEvent) => void);
    messageSpy: null | ((event: MessageEvent) => void);
    messageBinarySpy: null | ((event: MessageEvent) => void);
}

const spyFunctions: MockWebSocketSpyFunctions = {
    constructorSpy: null,
    openSpy: null,
    errorSpy: null,
    closeSpy: null,
    messageSpy: null,
    messageBinarySpy: null
};

export class MockWebSocketImpl extends WebSocket {
    _readyState: number;

    constructor(url: string | URL, protocols?: string | string[]) {
        super(url, protocols);
        this._readyState = this.OPEN;
        spyFunctions.constructorSpy?.(this.url);
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
        throw new Error('Method not implemented.');
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
export const mockWebSocket = () => {
    spyFunctions.constructorSpy = jest.fn();
    spyFunctions.openSpy = jest.fn();
    spyFunctions.errorSpy = jest.fn();
    spyFunctions.closeSpy = jest.fn();
    spyFunctions.messageSpy = jest.fn();
    spyFunctions.messageBinarySpy = jest.fn();
    global.WebSocket = MockWebSocketImpl;
    return spyFunctions;
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
