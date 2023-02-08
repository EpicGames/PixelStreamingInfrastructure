// Copyright Epic Games, Inc. All Rights Reserved.

import { Config, Flags, NumericParameters } from '../Config/Config';
import { Logger } from '../Logger/Logger';
import { AFKOverlay } from './AFKOverlay';

export class AFKController {
    // time out logic details
    closeTimeout = 10;
    active = false;
    countdownActive = false;
    warnTimer: ReturnType<typeof setTimeout> = undefined;
    countDown = 0;
    countDownTimer: ReturnType<typeof setInterval> = undefined;
    config: Config;
    afkOverlay: AFKOverlay;

    onAFKTimedOutCallback: () => void;

    constructor(config: Config, afkOverlay: AFKOverlay) {
        this.config = config;
        this.afkOverlay = afkOverlay;
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
            this.hideCurrentOverlay();
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
        clearInterval(this.warnTimer);
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
        this.showAfkOverlay();

        // update our countDown timer and overlay contents
        this.countDown = this.closeTimeout;
        this.countdownActive = true;
        this.afkOverlay.updateCountdown(this.countDown);

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
                this.hideCurrentOverlay();
                this.onAFKTimedOutCallback();
                Logger.Log(
                    Logger.GetStackTrace(),
                    'You have been disconnected due to inactivity'
                );

                // switch off the afk feature as stream has closed
                this.stopAfkWarningTimer();
            } else {
                this.afkOverlay.updateCountdown(this.countDown);
            }
        }, 1000);
    }

    /**
     * An override method for showing the afk overlay
     */
    showAfkOverlay() {
        // Base Functionality: Do Nothing
    }

    /**
     * An override method for hiding the afk overlay
     */
    hideCurrentOverlay() {
        // Base Functionality: Do Nothing
    }
}
