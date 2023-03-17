import { Config, Flags, NumericParameters } from '../Config/Config';
import { PixelStreaming } from '../PixelStreaming/PixelStreaming';
import { AfkTimedOutEvent, AfkWarningActivateEvent, AfkWarningUpdateEvent, AfkWarningDeactivateEvent } from '../Util/EventEmitter';
import { mockRTCRtpReceiver, unmockRTCRtpReceiver } from '../__test__/mockRTCRtpReceiver';
import {
    AFKController
} from './AFKController';

describe('AFKController', () => {
    let mockPixelStreaming: PixelStreaming;

    beforeEach(() => {
        mockRTCRtpReceiver();
        jest.useFakeTimers();
        mockPixelStreaming = {
            dispatchEvent: jest.fn()
        } as any as PixelStreaming; 
    });

    afterEach(() => {
        unmockRTCRtpReceiver();
        jest.resetAllMocks();
    });

    it('should not activate AFK timer if it has been disabled from settings', () => {
        const config = new Config({ initialSettings: { [Flags.AFKDetection]: false } });
        const onDismissAfk = jest.fn();
        const afkController = new AFKController(config, mockPixelStreaming, onDismissAfk);

        afkController.startAfkWarningTimer();
        expect(afkController.active).toBe(false);

        jest.advanceTimersByTime(1000000 * 1000);
        expect(mockPixelStreaming.dispatchEvent).not.toHaveBeenCalled();
    });

    it('should activate AFK timer and trigger it after specified delay if it has been enabled from settings', () => {
        const timeoutSeconds = 100;

        const config = new Config({ initialSettings: { [Flags.AFKDetection]: true, [NumericParameters.AFKTimeoutSecs]: timeoutSeconds} });
        const onDismissAfk = jest.fn();
        const afkController = new AFKController(config, mockPixelStreaming, onDismissAfk);

        afkController.startAfkWarningTimer();
        expect(afkController.active).toBe(true);

        // Advance to 1 second before AFK event:
        jest.advanceTimersByTime((timeoutSeconds - 1) * 1000);
        expect(mockPixelStreaming.dispatchEvent).not.toHaveBeenCalled();
        
        // advance 1 more second to trigger AFK warning
        jest.advanceTimersByTime(1000);
        expect(mockPixelStreaming.dispatchEvent).toHaveBeenCalledWith(new AfkWarningActivateEvent({
            countDown: 0,
            dismissAfk: expect.anything()
        }));
        expect(mockPixelStreaming.dispatchEvent).toHaveBeenCalledWith(new AfkWarningUpdateEvent({
            countDown: 10,
        }));

        // advance 10 more seconds to trigger AFK countdown updates and eventually timeout
        jest.advanceTimersByTime(10 * 1000);
        expect(mockPixelStreaming.dispatchEvent).toHaveBeenCalledWith(new AfkWarningUpdateEvent({
            countDown: 9,
        }));
        expect(mockPixelStreaming.dispatchEvent).toHaveBeenCalledWith(new AfkWarningUpdateEvent({
            countDown: 8,
        }));
        expect(mockPixelStreaming.dispatchEvent).toHaveBeenCalledWith(new AfkWarningUpdateEvent({
            countDown: 7,
        }));
        expect(mockPixelStreaming.dispatchEvent).toHaveBeenCalledWith(new AfkWarningUpdateEvent({
            countDown: 6,
        }));
        expect(mockPixelStreaming.dispatchEvent).toHaveBeenCalledWith(new AfkWarningUpdateEvent({
            countDown: 5,
        }));
        expect(mockPixelStreaming.dispatchEvent).toHaveBeenCalledWith(new AfkWarningUpdateEvent({
            countDown: 4,
        }));
        expect(mockPixelStreaming.dispatchEvent).toHaveBeenCalledWith(new AfkWarningUpdateEvent({
            countDown: 3,
        }));
        expect(mockPixelStreaming.dispatchEvent).toHaveBeenCalledWith(new AfkWarningUpdateEvent({
            countDown: 2,
        }));
        expect(mockPixelStreaming.dispatchEvent).toHaveBeenCalledWith(new AfkWarningUpdateEvent({
            countDown: 1,
        }));
        expect(mockPixelStreaming.dispatchEvent).toHaveBeenCalledWith(new AfkTimedOutEvent());
    });

    it('should postpone AFK activation each time resetAfkWarningTimer is called', () => {
        const timeoutSeconds = 100;

        const config = new Config({ initialSettings: { [Flags.AFKDetection]: true, [NumericParameters.AFKTimeoutSecs]: timeoutSeconds} });
        const onDismissAfk = jest.fn();
        const afkController = new AFKController(config, mockPixelStreaming, onDismissAfk);

        afkController.startAfkWarningTimer();

        // Advance to 1 second before AFK event:
        jest.advanceTimersByTime((timeoutSeconds - 1) * 1000);
        expect(mockPixelStreaming.dispatchEvent).not.toHaveBeenCalled();

        afkController.resetAfkWarningTimer();
        
        // advance 1 more second and ensure that AFK warning is not triggered since reset was called
        jest.advanceTimersByTime(1000);
        expect(mockPixelStreaming.dispatchEvent).not.toHaveBeenCalled();

        // reset AFK timer once more and ensure it is triggered exactly after timeoutSeconds
        afkController.resetAfkWarningTimer();

        // Advance to 1 second before AFK event:
        jest.advanceTimersByTime((timeoutSeconds - 1) * 1000);
        expect(mockPixelStreaming.dispatchEvent).not.toHaveBeenCalled();

        // advance 1 more second to trigger AFK warning
        jest.advanceTimersByTime(1000);
        expect(mockPixelStreaming.dispatchEvent).toHaveBeenCalledWith(new AfkWarningActivateEvent({
            countDown: 0,
            dismissAfk: expect.anything()
        }));
    });

    it('should dismiss AFK warning countdown if onAfkClick is called', () => {
        const timeoutSeconds = 100;

        const config = new Config({ initialSettings: { [Flags.AFKDetection]: true, [NumericParameters.AFKTimeoutSecs]: timeoutSeconds} });
        const onDismissAfk = jest.fn();
        const afkController = new AFKController(config, mockPixelStreaming, onDismissAfk);

        afkController.startAfkWarningTimer();

        // Advance to AFK event:
        jest.advanceTimersByTime(timeoutSeconds * 1000);
        expect(mockPixelStreaming.dispatchEvent).toHaveBeenCalledWith(new AfkWarningActivateEvent({
            countDown: 0,
            dismissAfk: expect.anything()
        }));
        expect(mockPixelStreaming.dispatchEvent).toHaveBeenCalledWith(new AfkWarningUpdateEvent({
            countDown: 10,
        }));

        // Advance one more second and call onAfkClick
        jest.advanceTimersByTime(1000);

        expect(mockPixelStreaming.dispatchEvent).toHaveBeenCalledWith(new AfkWarningUpdateEvent({
            countDown: 9,
        }));

        afkController.onAfkClick();
        expect(mockPixelStreaming.dispatchEvent).toHaveBeenCalledWith(new AfkWarningDeactivateEvent());

        // advance 10 more seconds and ensure there are no more countdown/timeout events emitted
        jest.advanceTimersByTime(10 * 1000);
        expect(mockPixelStreaming.dispatchEvent).toHaveBeenCalledTimes(4);
    });


});
