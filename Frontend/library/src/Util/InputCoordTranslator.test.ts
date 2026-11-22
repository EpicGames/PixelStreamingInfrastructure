import { InputCoordTranslator } from './InputCoordTranslator';

/**
 * Encodes a value the same way SendMessageController does for 'uint16' fields,
 * then reads it back, i.e. what the streamer actually receives.
 */
function overTheWire(value: number): number {
    const view = new DataView(new ArrayBuffer(2));
    view.setUint16(0, value, true);
    return view.getUint16(0, true);
}

describe('InputCoordTranslator', () => {
    describe('translateUnsigned', () => {
        it('keeps the right and bottom edges inside the uint16 range', () => {
            const translator = new InputCoordTranslator();
            translator.reconfigure({ width: 1920, height: 1080 }, { width: 1920, height: 1080 });

            const coord = translator.translateUnsigned(1920, 1080);

            expect(coord.inRange).toBe(true);
            expect(coord.x).toBeLessThanOrEqual(65535);
            expect(coord.y).toBeLessThanOrEqual(65535);
            // Without clamping, 65536 wraps to 0 on the wire and the edge becomes the opposite edge.
            expect(overTheWire(coord.x)).toBe(65535);
            expect(overTheWire(coord.y)).toBe(65535);
        });

        it('keeps the far edge of a letterboxed video inside the uint16 range', () => {
            const translator = new InputCoordTranslator();
            // 16:9 video in a 1000x450 player: pillarboxed to 800px wide, spanning x in [100, 900].
            translator.reconfigure({ width: 1000, height: 450 }, { width: 1920, height: 1080 });

            const coord = translator.translateUnsigned(900, 450);

            expect(coord.inRange).toBe(true);
            expect(overTheWire(coord.x)).toBe(65535);
            expect(overTheWire(coord.y)).toBe(65535);
        });

        it('maps the top left corner to zero', () => {
            const translator = new InputCoordTranslator();
            translator.reconfigure({ width: 1920, height: 1080 }, { width: 1920, height: 1080 });

            expect(translator.translateUnsigned(0, 0)).toEqual({ inRange: true, x: 0, y: 0 });
        });

        it('maps the centre to the middle of the range', () => {
            const translator = new InputCoordTranslator();
            translator.reconfigure({ width: 1920, height: 1080 }, { width: 1920, height: 1080 });

            expect(translator.translateUnsigned(960, 540)).toEqual({ inRange: true, x: 32768, y: 32768 });
        });

        it('reports coordinates in the letterbox bars as out of range', () => {
            const translator = new InputCoordTranslator();
            translator.reconfigure({ width: 1000, height: 450 }, { width: 1920, height: 1080 });

            expect(translator.translateUnsigned(50, 225).inRange).toBe(false);
            expect(translator.translateUnsigned(950, 225).inRange).toBe(false);
        });

        it('is increasing across the whole axis once encoded', () => {
            const translator = new InputCoordTranslator();
            translator.reconfigure({ width: 1920, height: 1080 }, { width: 1920, height: 1080 });

            let previous = -1;
            for (let px = 0; px <= 1920; px++) {
                const encoded = overTheWire(translator.translateUnsigned(px, 0).x);
                expect(encoded).toBeGreaterThanOrEqual(previous);
                previous = encoded;
            }
        });
    });

    describe('untranslateUnsigned', () => {
        it('inverts translateUnsigned away from the clamped edge', () => {
            const translator = new InputCoordTranslator();
            translator.reconfigure({ width: 960, height: 480 }, { width: 1920, height: 1080 });

            const coord = translator.translateUnsigned(480, 123);
            const back = translator.untranslateUnsigned(coord.x, coord.y);

            expect(back.x).toBeCloseTo(480, 6);
            expect(back.y).toBeCloseTo(123, 6);
        });
    });
});
