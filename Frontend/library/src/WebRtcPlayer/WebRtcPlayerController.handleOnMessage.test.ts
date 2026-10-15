import { StreamMessageController } from '../UeInstanceMessage/StreamMessageController';
import { WebRtcPlayerController } from './WebRtcPlayerController';

describe('WebRtcPlayerController.handleOnMessage', () => {
    beforeEach(() => {
        jest.spyOn(console, 'log').mockImplementation(() => undefined);
        jest.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('drops a message with an unknown type instead of throwing out of onmessage', () => {
        // Calls the prototype method with a stub `this`: only streamMessageController is read.
        const stub = { streamMessageController: new StreamMessageController() };
        const event = { data: new Uint8Array([200, 1, 2]).buffer } as MessageEvent;

        expect(() => WebRtcPlayerController.prototype.handleOnMessage.call(stub, event)).not.toThrow();
        expect(console.error).toHaveBeenCalled();
    });
});
