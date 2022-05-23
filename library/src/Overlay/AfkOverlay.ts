import { Overlay } from "./Overlay";

export class AfkOverlay extends Overlay {
    countDown = 0;

    setCountDown(countDown: number) {
        this.countDown = countDown;
    }

    getCountDown() {
        return this.countDown;
    }
}