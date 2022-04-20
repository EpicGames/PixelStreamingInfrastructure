import { ControlSchemeType } from "../Config/Config";
import { IAfkOverlayController } from "./IAfkOverlayController";

export class AfkOverlayController {
    afk: afk;
    iAfkOverlayController: IAfkOverlayController;
    controlScheme: number;
    idleTimer = 0;
    idleInterval: ReturnType<typeof setInterval>;
    wasTimedOut = false;

    constructor(controlScheme: number) {
        this.afk = new afk();
        this.controlScheme = controlScheme;

    }

    /**
     * Start the warning timer  
     */
    startAfkWarningTimer() {
        console.log("started warning timer")
        this.afk.active = this.afk.enabled;
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
        if (this.afk.active) {
            clearTimeout(this.afk.warnTimer);
            this.afk.warnTimer = setTimeout(() => { this.showAfkOverlay() }, this.afk.warnTimeout * 1000); //1000
        }
    }

    /**
     * Update the countdown text when counting down  
     */
    updateAfkOverlayText() {
        this.afk.overlay.innerHTML = '<center>No activity detected<br>Disconnecting in ' + this.afk.countdown + ' seconds<br>Click to continue<br></center>';
    }

    /**
     * This callback is called during the count down timer  
     */
    setIntervalCallBack() {
        this.afk.countdown--;
        if (this.afk.countdown == 0) {
            // The user failed to click so disconnect them.
            this.iAfkOverlayController.afkHideOverlay();
            this.iAfkOverlayController.afkCloseWs();
            this.stopIdleWatch();
            this.wasTimedOut = true;
        } else {
            // Update the countdown message.
            this.updateAfkOverlayText();
        }
    }

    /**
     * Show the AFK overlay and begin the countdown   
     */
    showAfkOverlay() {
        console.log("showing afk overlay")
        // Pause the timer while the user is looking at the inactivity warning overlay.
        this.stopAfkWarningTimer();

        // Show the inactivity warning overlay.
        this.afk.overlay = document.createElement('div');
        this.afk.overlay.id = 'afkOverlay';

        this.iAfkOverlayController.afkSetOverlay();

        this.afk.countdown = this.afk.closeTimeout;
        this.updateAfkOverlayText();

        if (this.controlScheme == ControlSchemeType.LockedMouse) {
            document.exitPointerLock();
        }

        this.afk.countdownTimer = setInterval(this.setIntervalCallBack.bind(this), 1000);

        this.stopIdleWatch();
    }

    //EXTRAS for watching for inactivity. may remove
    /**
     * Stop the Idle watcher    
     */
    stopIdleWatch() {
        clearInterval(this.idleInterval);
    }

    /**
     * Start the Idle watcher   
     */
    startIdleWatch() {
        // Increment the idle time counter every minute.
        this.idleInterval = setInterval(this.checkIdleTime.bind(this), 60000); // 1 minute
    }

    /**
     * Starts the Idle watcher and set the idleTimer to 0 when mouse and keyboard interactions are made    
     */
    startAfkWatch() {
        this.startIdleWatch();

        document.addEventListener('keypress', function () {
            this.idleTimer = 0;
        }.bind(this));

        document.addEventListener('mousemove', function () {
            this.idleTimer = 0;
        }.bind(this));
    }

    /**
     * checks when the idleTimer get to 10 and activates the AFK countdown timer     
     */
    checkIdleTime() {
        this.idleTimer++;
        if (this.idleTimer > 10) { // 10 minutes
            this.afk.enabled = true;
            this.startAfkWarningTimer();
        }
    }

}

export class afk {
    enabled = false;
    warnTimeout = 1;
    closeTimeout = 10;
    active = false;
    overlay: HTMLDivElement = undefined;
    warnTimer: ReturnType<typeof setTimeout> = undefined;
    countdown = 0;
    countdownTimer: ReturnType<typeof setInterval> = undefined;
}

/* //AFK testing
document.addEventListener('keypress', handelFreezeFrameActivation);

function handelFreezeFrameActivation(e: KeyboardEvent) {
    if (e.key === '3' && afkOverlayController.afk.enabled === false) {
        afkOverlayController.afk.enabled = true;
        afkOverlayController.startAfkWarningTimer();
    }
}
*/