import { Overlay } from "./Overlay";

export class AfkOverlay extends Overlay {
    afkOverlayUpdateHtml: string;
    countDown = 0;

    returnCountdown(){
        return this.countDown;
    }

    /**
     * set the afk overlays update html text 
     * @param updateHtml 
     */
    setAfkOverlayUpdateHtml(updateHtml: string) {
        this.afkOverlayUpdateHtml = updateHtml;
    }

    /**
     * Gets the latest countDown number and updates the overlay html as the html will contain the countDown variable
     * @param countDown 
     * @param afkOverlayUpdateHtml 
     */
    updateAfkOverlayContents(countDown: number, afkOverlayUpdateHtml: string) {
        this.countDown = countDown;
        this.updateOverlayContents(afkOverlayUpdateHtml);
    }
}