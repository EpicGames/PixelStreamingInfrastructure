import { TextDecoder as NodeTextDecoder } from 'util';
import { ResponseController } from './ResponseController';

// The jsdom test environment does not expose TextDecoder (see PixelStreaming.test.ts); onResponse needs it.
if (typeof (globalThis as any).TextDecoder === 'undefined') {
    (globalThis as any).TextDecoder = NodeTextDecoder;
}

/** The wire format onResponse expects: one type byte, then the text as UTF-16LE. */
const responseBuffer = (text: string): ArrayBuffer => {
    const encoded = Buffer.from(text, 'utf16le');
    const message = new Uint8Array(encoded.length + 1);
    message.set(encoded, 1);
    return message.buffer;
};

describe('ResponseController', () => {
    beforeEach(() => {
        jest.spyOn(console, 'log').mockImplementation(() => undefined);
        jest.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('delivers a response to every registered listener', () => {
        const controller = new ResponseController();
        const first = jest.fn();
        const second = jest.fn();
        controller.addResponseEventListener('first', first);
        controller.addResponseEventListener('second', second);

        controller.onResponse(responseBuffer('{"type":"ping"}'));

        expect(first).toHaveBeenCalledWith('{"type":"ping"}');
        expect(second).toHaveBeenCalledWith('{"type":"ping"}');
    });

    it('still delivers to later listeners when an earlier one throws', () => {
        const controller = new ResponseController();
        const before = jest.fn();
        const throwing = jest.fn((_response: string) => {
            throw new Error('listener failure');
        });
        const after = jest.fn();
        controller.addResponseEventListener('before', before);
        controller.addResponseEventListener('throwing', throwing);
        controller.addResponseEventListener('after', after);

        expect(() => controller.onResponse(responseBuffer('{"type":"turnStart"}'))).not.toThrow();

        expect(throwing).toHaveBeenCalledTimes(1);
        expect(after).toHaveBeenCalledWith('{"type":"turnStart"}');
        expect(console.error).toHaveBeenCalled();
    });
});
