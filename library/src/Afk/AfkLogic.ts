import { Config, ControlSchemeType, Flags, NumericParameters } from "../Config/Config";
import { Logger } from "../Logger/Logger";
export class AfkLogic {
    // time out logic details 
    closeTimeout = 10;
    active = false;
    warnTimer: ReturnType<typeof setTimeout> = undefined;
    countDown = 0;
    countDownTimer: ReturnType<typeof setInterval> = undefined;
    config: Config;

    constructor(config: Config) {
        this.config = config;
    }

    /**
     * The methods that occur when an afk event listener is clicked
     */
    onAfkClick() {
        clearInterval(this.countDownTimer);
        this.startAfkWarningTimer();
    }

    /**
     * Start the warning timer if a timeout is set greater that 0 seconds   
     */
    startAfkWarningTimer() {
        if (this.config.getNumericSettingValue(NumericParameters.AFKTimeoutSecs) > 0 && this.config.isFlagEnabled(Flags.AFKDetection)) {
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
            this.warnTimer = setTimeout(() => this.activateAfkEvent(), this.config.getNumericSettingValue(NumericParameters.AFKTimeoutSecs) * 1000);
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
        this.updateAfkCountdown();

        // if we are in locked mouse exit pointerlock
		if (!this.config.isFlagEnabled(Flags.ControlScheme)) {
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
                this.setDisconnectMessageOverride("You have been disconnected due to inactivity");
                this.closeWebSocket();
                Logger.Log(Logger.GetStackTrace(), "You have been disconnected due to inactivity");

                // switch off the afk feature as stream has closed 
                this.stopAfkWarningTimer();
            } else {
                // Update the countDown message.
                this.updateAfkCountdown();
            }
        }, 1000);
    }

    /**
     * An override method for updating the afk countdown number in the overlay 
     */
    updateAfkCountdown() { 
		// Base Functionality: Do Nothing
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

    /**
     * An  override method for setting the override for the disconnect message
     */
    setDisconnectMessageOverride(message: string) { 
		// Base Functionality: Do Nothing
	}

    /**
     * An override method for closing the websocket connection from the clients side
     */
    closeWebSocket() { 
		// Base Functionality: Do Nothing
	}
}