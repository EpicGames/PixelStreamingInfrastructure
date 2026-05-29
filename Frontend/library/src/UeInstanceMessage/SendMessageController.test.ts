import { DataChannelSender } from '../DataChannel/DataChannelSender';
import { SendMessageController } from './SendMessageController';
import { StreamMessageController } from './StreamMessageController';

describe('SendMessageController', () => {
    let streamMessageController: StreamMessageController;
    let dataChannelSender: DataChannelSender;
    let sendData: jest.Mock;
    let controller: SendMessageController;

    beforeEach(() => {
        streamMessageController = new StreamMessageController();
        sendData = jest.fn();
        dataChannelSender = {
            canSend: () => true,
            sendData
        } as unknown as DataChannelSender;
        controller = new SendMessageController(dataChannelSender, streamMessageController);
    });

    describe("structure: ['raw']", () => {
        it('prepends the message id byte and copies the Uint8Array verbatim', () => {
            streamMessageController.toStreamerMessages.set('MyBinaryMsg', {
                id: 137,
                structure: ['raw']
            });

            const payload = new Uint8Array([0x00, 0x01, 0xff, 0x42]);
            controller.sendMessageToStreamer('MyBinaryMsg', [payload]);

            expect(sendData).toHaveBeenCalledTimes(1);
            const sent = new Uint8Array(sendData.mock.calls[0][0] as ArrayBuffer);
            expect(Array.from(sent)).toEqual([137, 0x00, 0x01, 0xff, 0x42]);
        });

        it('handles an empty payload', () => {
            streamMessageController.toStreamerMessages.set('EmptyMsg', {
                id: 200,
                structure: ['raw']
            });

            controller.sendMessageToStreamer('EmptyMsg', [new Uint8Array(0)]);

            const sent = new Uint8Array(sendData.mock.calls[0][0] as ArrayBuffer);
            expect(Array.from(sent)).toEqual([200]);
        });

        it('packs raw alongside other typed fields', () => {
            streamMessageController.toStreamerMessages.set('Mixed', {
                id: 50,
                structure: ['uint8', 'raw', 'uint8']
            });

            controller.sendMessageToStreamer('Mixed', [
                0xaa,
                new Uint8Array([0xbb, 0xcc]),
                0xdd
            ]);

            const sent = new Uint8Array(sendData.mock.calls[0][0] as ArrayBuffer);
            expect(Array.from(sent)).toEqual([50, 0xaa, 0xbb, 0xcc, 0xdd]);
        });
    });

    describe('backwards compatibility', () => {
        it('still packs typed structures as before', () => {
            streamMessageController.toStreamerMessages.set('Typed', {
                id: 1,
                structure: ['uint8', 'uint16']
            });

            controller.sendMessageToStreamer('Typed', [0x10, 0x2030]);

            const sent = new Uint8Array(sendData.mock.calls[0][0] as ArrayBuffer);
            // id (1), uint8 0x10, uint16 0x2030 little-endian = 0x30, 0x20
            expect(Array.from(sent)).toEqual([1, 0x10, 0x30, 0x20]);
        });
    });
});
