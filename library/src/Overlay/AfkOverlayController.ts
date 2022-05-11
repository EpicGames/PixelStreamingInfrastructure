import { ControlSchemeType } from "../Config/Config";

export class AfkOverlayController {
    afk: afk;
    controlScheme: number;
    idleTimer = 0;
    idleInterval: ReturnType<typeof setInterval>;
    wasTimedOut = false;

    constructor(controlScheme: number, afkTimeout: number) {
        this.afk = new afk(afkTimeout);
        this.controlScheme = controlScheme;
    }

    /**
     * Start the warning timer if a timeout is set greater that 0 seconds   
     */
    startAfkWarningTimer() {
        if(this.afk.warnTimeout > 0){
            this.afk.active = true;
        }else{
            this.afk.active = false;
        }
        this.resetAfkWarningTimer();
    }

    /**
     * Stop the timer which when elapsed will warn the user they are inactive.  
     */
    stopAfkWarningTimer() {
        this.afk.active = false;
    }

    /**
     * If the user interacts then reset the warning timer.  
     */
    resetAfkWarningTimer() {
        console.log("reseting timer")
        if (this.afk.active) {
            clearTimeout(this.afk.warnTimer);
            this.afk.warnTimer = setTimeout(() => { this.showAfkOverlay() }, this.afk.warnTimeout * 1000);
        }
    }

    /**
     * Update the countdown text when counting down  
     */
    updateAfkOverlayText() {
        this.afk.overlay.innerHTML = '<center>No activity detected<br>Disconnecting in ' + this.afk.countdown + ' seconds<br>Click to continue<br></center>';
    }

    /**
     * Show the AFK overlay and begin the countdown   
     */
    showAfkOverlay() {
        // Pause the timer while the user is looking at the inactivity warning overlay.
        this.stopAfkWarningTimer();

        // Show the inactivity warning overlay.
        this.afk.overlay = document.createElement('div');
        this.afk.overlay.id = 'afkOverlay';

        // set the afk overlay 
        this.afkSetOverlay();

        this.afk.countdown = this.afk.closeTimeout;
        this.updateAfkOverlayText();

        if (this.controlScheme == ControlSchemeType.LockedMouse) {
            document.exitPointerLock();
        }

        this.afk.countdownTimer = setInterval(() => {
            this.afk.countdown--;
            if (this.afk.countdown == 0) {
                // The user failed to click so disconnect them.
                this.afkHideOverlay();
                this.afkCloseWs();
            } else {
                // Update the countdown message.
                this.updateAfkOverlayText();
            }
        }, 1000);
    }

    /**
     * An override method for setting the Afk Overlay 
     */
    afkSetOverlay() { }

    /**
     * An override method for hiding the Afk overlay
     */
    afkHideOverlay() { }

    /**
     * An override method for closing the websocket within the AfkOverlayController
     */
    afkCloseWs() { }
}
export class afk {
    warnTimeout = 0;
    closeTimeout = 10;
    active = false;
    overlay: HTMLDivElement = undefined;
    warnTimer: ReturnType<typeof setTimeout> = undefined;
    countdown = 0;
    countdownTimer: ReturnType<typeof setInterval> = undefined;

    constructor(afkTimeout: number) {
        this.warnTimeout = afkTimeout;
    }
}