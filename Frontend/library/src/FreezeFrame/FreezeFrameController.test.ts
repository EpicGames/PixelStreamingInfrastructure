import { FreezeFrameController } from './FreezeFrameController';

/** One freeze-frame message: a type byte, the little-endian total size, then this chunk of the JPEG. */
const chunkMessage = (totalSize: number, payload: Uint8Array): Uint8Array => {
    const message = new Uint8Array(1 + 4 + payload.length);
    new DataView(message.buffer).setInt32(1, totalSize, true);
    message.set(payload, 5);
    return message;
};

describe('FreezeFrameController', () => {
    beforeEach(() => {
        jest.spyOn(console, 'log').mockImplementation(() => undefined);
        jest.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('joins the chunks into one JPEG and shows it as a data URI', () => {
        const controller = new FreezeFrameController(document.createElement('div'));
        // Larger than one 32 KiB slice, so the base64 encoder runs more than once.
        const frame = Uint8Array.from({ length: 40000 }, (_, i) => (i * 31) % 256);
        const onLoad = jest.fn();

        controller.processFreezeFrameMessage(chunkMessage(frame.length, frame.subarray(0, 16000)), onLoad);
        controller.processFreezeFrameMessage(
            chunkMessage(frame.length, frame.subarray(16000, 30000)),
            onLoad
        );
        expect(controller.valid).toBe(false);
        controller.processFreezeFrameMessage(chunkMessage(frame.length, frame.subarray(30000)), onLoad);

        expect(controller.valid).toBe(true);
        expect(controller.jpeg).toEqual(frame);
        expect(controller.freezeFrame.imageElement.src).toBe(
            'data:image/jpeg;base64,' + Buffer.from(frame).toString('base64')
        );
    });

    it('drops a frame that delivers more bytes than it advertised', () => {
        const controller = new FreezeFrameController(document.createElement('div'));
        const onLoad = jest.fn();

        controller.processFreezeFrameMessage(chunkMessage(2, Uint8Array.of(1, 2, 3)), onLoad);

        expect(controller.valid).toBe(false);
        expect(controller.receiving).toBe(false);
        expect(controller.jpeg).toBeUndefined();
        expect(onLoad).not.toHaveBeenCalled();
    });
});
