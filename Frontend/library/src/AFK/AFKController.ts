// Copyright Epic Games, Inc. All Rights Reserved.

import { Config, Flags, NumericParameters } from '../Config/Config';
import { Logger } from '../Logger/Logger';
import { PixelStreaming } from '../PixelStreaming/PixelStreaming';
import {
    AfkTimedOutEvent,
    AfkWarningActivateEvent,
    AfkWarningDeactivateEvent,
    AfkWarningUpdateEvent
} from '../Util/EventEmitter';

export class AFKController {
    // time out logic details
    closeTimeout = 10;
    active = false;
    countdownActive = false;
    warnTimer: ReturnType<typeof setTimeout> = undefined;
    countDown = 0;
    countDownTimer: ReturnType<typeof setInterval> = undefined;
    config: Config;
    pixelStreaming: PixelStreaming;
    onDismissAfk: () => void;

    onAFKTimedOutCallback: () => void;

    constructor(
        config: Config,
        pixelStreaming: PixelStreaming,
        onDismissAfk: () => void
    ) {
        this.config = config;
        this.pixelStreaming = pixelStreaming;
        this.onDismissAfk = onDismissAfk;
        this.onAFKTimedOutCallback = () => {
            console.log(
                'AFK timed out, did you want to override this callback?'
            );
        };
    }

    /**
     * The methods that occur when an afk event listener is clicked
     */
    onAfkClick() {
        clearInterval(this.countDownTimer);

        if (this.active || this.countdownActive) {
            this.startAfkWarningTimer();
            this.pixelStreaming.dispatchEvent(
                new AfkWarningDeactivateEvent()
            );
        }
    }

    /**
     * Start the warning timer if a timeout is set greater that 0 seconds
     */
    startAfkWarningTimer() {
        if (
            this.config.getNumericSettingValue(
                NumericParameters.AFKTimeoutSecs
            ) > 0 &&
            this.config.isFlagEnabled(Flags.AFKDetection)
        ) {
            this.active = true;
        } else {
            this.active = false;
        }
        this.resetAfkWarningTimer();
    }

    /**
     * Stop the afk warning timer
     */
    stopAfkWarningTimer() {
        this.active = false;
        this.countdownActive = false;
        clearTimeout(this.warnTimer);
        clearInterval(this.countDownTimer);
    }

    /**
     * Pause the timer which when elapsed will warn the user they are inactive.
     */
    pauseAfkWarningTimer() {
        this.active = false;
    }

    /**
     * If the user interacts then reset the warning timer.
     */
    resetAfkWarningTimer() {
        if (this.active && this.config.isFlagEnabled(Flags.AFKDetection)) {
            clearTimeout(this.warnTimer);
            this.warnTimer = setTimeout(
                () => this.activateAfkEvent(),
                this.config.getNumericSettingValue(
                    NumericParameters.AFKTimeoutSecs
                ) * 1000
            );
        }
    }

    /**
     * Show the AFK overlay and begin the countDown
     */
    activateAfkEvent() {
        // Pause the timer while the user is looking at the inactivity warning overlay
        this.pauseAfkWarningTimer();

        // instantiate a new overlay
        this.pixelStreaming.dispatchEvent(
            new AfkWarningActivateEvent({
                countDown: this.countDown,
                dismissAfk: this.onDismissAfk
            })
        );

        // update our countDown timer and overlay contents
        this.countDown = this.closeTimeout;
        this.countdownActive = true;
        this.pixelStreaming.dispatchEvent(
            new AfkWarningUpdateEvent({ countDown: this.countDown })
        );

        // if we are in locked mouse exit pointerlock
        if (!this.config.isFlagEnabled(Flags.HoveringMouseMode)) {
            // minor hack to alleviate ios not supporting pointerlock
            if (document.exitPointerLock) {
                document.exitPointerLock();
            }
        }

        // reset our countDown interval accordingly
        this.countDownTimer = setInterval(() => {
            this.countDown--;
            if (this.countDown == 0) {
                // The user failed to click so hide the overlay and disconnect them.
                this.pixelStreaming.dispatchEvent(
                    new AfkTimedOutEvent()
                );
                this.onAFKTimedOutCallback();
                Logger.Log(
                    Logger.GetStackTrace(),
                    'You have been disconnected due to inactivity'
                );

                // switch off the afk feature as stream has closed
                this.stopAfkWarningTimer();
            } else {
                this.pixelStreaming.dispatchEvent(
                    new AfkWarningUpdateEvent({ countDown: this.countDown })
                );
            }
        }, 1000);
    }
}
