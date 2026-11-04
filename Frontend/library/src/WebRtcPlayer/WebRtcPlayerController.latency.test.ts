import { TextDecoder as NodeTextDecoder } from 'util';
import { WebRtcPlayerController } from './WebRtcPlayerController';

// The jsdom test environment does not expose TextDecoder (see PixelStreaming.test.ts); the handler needs it.
if (typeof (globalThis as any).TextDecoder === 'undefined') {
    (globalThis as any).TextDecoder = NodeTextDecoder;
}

/** A data channel message: a type byte, then the payload as UTF-16LE text. */
const utf16Message = (type: number, text: string): ArrayBuffer => {
    const encoded = Buffer.from(text, 'utf16le');
    const message = new Uint8Array(encoded.length + 1);
    message[0] = type;
    message.set(encoded, 1);
    return message.buffer;
};

describe('WebRtcPlayerController.handleLatencyTestResult', () => {
    beforeEach(() => {
        jest.spyOn(console, 'log').mockImplementation(() => undefined);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('computes endToEndLatency from the frame display, network and capture terms', () => {
        jest.spyOn(Date, 'now').mockReturnValue(1000);
        const onLatencyTestResult = jest.fn();
        // Stub `this`: the handler reads the send time and forwards the result to the pixel streaming object.
        const stub = {
            latencyStartTime: 1000,
            pixelStreaming: { _onLatencyTestResult: onLatencyTestResult }
        };
        const payload = JSON.stringify({
            ReceiptTimeMs: 0,
            TransmissionTimeMs: 0,
            frameDisplayDeltaTimeMs: 5,
            CaptureToSendMs: 7
        });

        WebRtcPlayerController.prototype.handleLatencyTestResult.call(stub, utf16Message(6, payload));

        // Network latency is zero here, so the result is 5 + 0 + 7. The old comma expression gave only 7.
        const result = onLatencyTestResult.mock.calls[0][0];
        expect(result.endToEndLatency).toBe(12);
    });
});
