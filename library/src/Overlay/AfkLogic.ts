import { ControlSchemeType } from "../Config/Config";
import { AfkOverlay } from "./AfkOverlay";
export class AfkLogic {
    // time out logic details 
    controlScheme: number;
    warnTimeout = 0;
    closeTimeout = 10;
    active = false;
    warnTimer: ReturnType<typeof setTimeout> = undefined;
    countdown = 0;
    countdownTimer: ReturnType<typeof setInterval> = undefined;
    afkOverlay: AfkOverlay;

    constructor(controlScheme: number, afkTimeout: number) {
        this.warnTimeout = afkTimeout;
        this.controlScheme = controlScheme;
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
            this.warnTimer = setTimeout(() => { this.activateAfkEvent() }, this.warnTimeout * 1000);
        }
    }

    /**
     * Show the AFK overlay and begin the countdown   
     */
    activateAfkEvent() {
        // Pause the timer while the user is looking at the inactivity warning overlay
        this.stopAfkWarningTimer();

        // instantiate a new overlay 
        this.afkOverlay = new AfkOverlay(this.afkOverlay.baseParentDiv, this.afkOverlay.htmlClass, this.afkOverlay.htmlElement, this.afkOverlay.onClickEvent)

        // update our countdown timer and overlay contents
        this.countdown = this.closeTimeout;
        this.afkOverlay.updateAfkOverlayContents(this.countdown, this.afkOverlay.afkOverlayUpdateHtml);

        // if we are in locked mouse exit pointerlock 
        if (this.controlScheme == ControlSchemeType.LockedMouse) {
            document.exitPointerLock();
        }

        // reset our countdown interval accordingly 
        this.countdownTimer = setInterval(() => {
            this.countdown--;
            if (this.countdown == 0) {
                // The user failed to click so hide the overlay and disconnect them.
                this.afkOverlay.hideOverlay();
            } else {
                // Update the countdown message.
                this.afkOverlay.updateAfkOverlayContents(this.countdown, this.afkOverlay.afkOverlayUpdateHtml);
            }
        }, 1000);
    }
}