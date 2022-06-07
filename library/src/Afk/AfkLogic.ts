import { ControlSchemeType } from "../Config/Config";
export class AfkLogic {
    // time out logic details 
    controlScheme: number;
    warnTimeout = 0;
    closeTimeout = 10;
    active = false;
    warnTimer: ReturnType<typeof setTimeout> = undefined;
    countDown = 0;
    countDownTimer: ReturnType<typeof setInterval> = undefined;

    constructor(controlScheme: number, afkTimeout: number) {
        this.warnTimeout = afkTimeout;
        this.controlScheme = controlScheme;
    }

    /**
     * The methods that occur when an afk event listener is clicked
     */
    onAfkClick() {
        this.hideCurrentOverlay();
        clearInterval(this.countDownTimer);
        this.startAfkWarningTimer();
    }

    /**
     * Start the warning timer if a timeout is set greater that 0 seconds   
     */
    startAfkWarningTimer() {
        if (this.warnTimeout > 0) {
            this.active = true;
        } else {
            this.active = false;
        }
        this.resetAfkWarningTimer();
    }

    /**
     * Stop the timer which when elapsed will warn the user they are inactive.  
     */
    stopAfkWarningTimer() {
        this.active = false;
    }

    /**
     * If the user interacts then reset the warning timer.  
     */
    resetAfkWarningTimer() {
        if (this.active) {
            clearTimeout(this.warnTimer);
            this.warnTimer = setTimeout(() => this.activateAfkEvent(), this.warnTimeout * 1000);
        }
    }

    /**
     * Show the AFK overlay and begin the countDown   
     */
    activateAfkEvent() {
        // Pause the timer while the user is looking at the inactivity warning overlay
        this.stopAfkWarningTimer();

        // instantiate a new overlay 
        this.showAfkOverlay();

        // update our countDown timer and overlay contents
        this.countDown = this.closeTimeout;
        this.updateAfkCountdown();

        // if we are in locked mouse exit pointerlock 
        if (this.controlScheme == ControlSchemeType.LockedMouse) {
            document.exitPointerLock();
        }

        // reset our countDown interval accordingly 
        this.countDownTimer = setInterval(() => {
            this.countDown--;
            if (this.countDown == 0) {
                // The user failed to click so hide the overlay and disconnect them.
                this.hideCurrentOverlay();
                this.closeWebSocket();
                console.log("you have been disconnected due to inactivity");

                // switch off the afk feature as stream has closed 
                clearInterval(this.countDownTimer);
            } else {
                // Update the countDown message.
                this.updateAfkCountdown();
            }
        }, 1000);
    }

    /**
     * An override method for updating the afk countdown number in the overlay 
     */
    updateAfkCountdown() { }

    /**
     * An override method for showing the afk overlay 
     */
    showAfkOverlay() { }

    /**
     * An override method for hiding the afk overlay 
     */
    hideCurrentOverlay() { }

    /**
     * An override method for closing the websocket connection from the clients side
     */
    closeWebSocket() { }
}