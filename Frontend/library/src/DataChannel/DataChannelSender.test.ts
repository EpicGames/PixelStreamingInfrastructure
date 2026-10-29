import { DataChannelController } from './DataChannelController';
import { DataChannelSender } from './DataChannelSender';

describe('DataChannelSender', () => {
    let send: jest.Mock;
    let resetAfkWarningTimer: jest.Mock;
    let sender: DataChannelSender;

    beforeEach(() => {
        send = jest.fn();
        resetAfkWarningTimer = jest.fn();
        const dataChannelProvider = {
            getDataChannelInstance: () => ({ dataChannel: { readyState: 'open', send } })
        } as unknown as DataChannelController;
        sender = new DataChannelSender(dataChannelProvider);
        sender.resetAfkWarningTimerOnDataSend = resetAfkWarningTimer;
        jest.spyOn(console, 'log').mockImplementation(() => undefined);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should reset the AFK warning timer when it sends', () => {
        sender.sendData(new ArrayBuffer(1));

        expect(send).toHaveBeenCalledTimes(1);
        expect(resetAfkWarningTimer).toHaveBeenCalledTimes(1);
    });

    it('should not reset the AFK warning timer for a message that is not user activity', () => {
        sender.sendData(new ArrayBuffer(1), false);

        expect(send).toHaveBeenCalledTimes(1);
        expect(resetAfkWarningTimer).not.toHaveBeenCalled();
    });
});
