import { ControlSchemeType } from "../Config/Config";
import { AfkOverlay } from "./AfkOverlay";
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
     * @param afkOverlay the afk overlay 
     */
    onAfkEventListener(afkOverlay: AfkOverlay) {
        //afkOverlay.hideOverlay();
        clearInterval(this.countDownTimer);
        this.startAfkWarningTimer(afkOverlay);
    }

    /**
     * Start the warning timer if a timeout is set greater that 0 seconds   
     */
    startAfkWarningTimer(afkOverlay: AfkOverlay) {
        if (this.warnTimeout > 0) {
            this.active = true;
        } else {
            this.active = false;
        }
        this.resetAfkWarningTimer(afkOverlay);
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
    resetAfkWarningTimer(afkOverlay: AfkOverlay) {
        if (this.active) {
            clearTimeout(this.warnTimer);
            this.warnTimer = setTimeout(() => { this.activateAfkEvent(afkOverlay) }, this.warnTimeout * 1000);
        }
    }

    /**
     * Show the AFK overlay and begin the countDown   
     */
    activateAfkEvent(afkOverlay: AfkOverlay) {
        // Pause the timer while the user is looking at the inactivity warning overlay
        this.stopAfkWarningTimer();

        // instantiate a new overlay 
        //afkOverlay.createNewOverlayElement();

        // update our countDown timer and overlay contents
        this.countDown = this.closeTimeout;
        //afkOverlay.setCountDown(this.countDown);
        //afkOverlay.updateOverlayContents(undefined);

        // if we are in locked mouse exit pointerlock 
        if (this.controlScheme == ControlSchemeType.LockedMouse) {
            document.exitPointerLock();
        }

        // reset our countDown interval accordingly 
        this.countDownTimer = setInterval(() => {
            this.countDown--;
            if (this.countDown == 0) {
                // The user failed to click so hide the overlay and disconnect them.
                //afkOverlay.hideOverlay();
                this.closeWebSocket();

                // switch off the afk feature as stream has closed 
                this.active = false;
                this.warnTimeout = 0;
            } else {
                // Update the countDown message.
                //afkOverlay.setCountDown(this.countDown);
                //afkOverlay.updateOverlayContents(undefined);
            }
        }, 1000);
    }

    /**
     * An override method for closing the websocket connection from the clients side
     */
    closeWebSocket() { }
}