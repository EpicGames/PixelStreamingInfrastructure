import { Logger } from "../Logger/Logger";
import { IVideoPlayer } from "../VideoPlayer/IVideoPlayer";
import { INormalizeAndQuantize } from "./INormalizeAndQuantize";

export class NormalizeAndQuantize implements INormalizeAndQuantize {
    videoElementProvider: IVideoPlayer;
    playerElement: HTMLElement;
    videoElement: HTMLVideoElement;
    ratio: number;

    constructor(videoElementProvider: IVideoPlayer) {
        this.videoElementProvider = videoElementProvider;
    }

    normalizeAndQuantizeUnsigned(x: number, y: number): NormaliseAndQuantiseUnsigned {
        return this.setterNormalizeAndQuantizeUnsigned(x, y);
    }

    unquantizeAndDenormalizeUnsigned(x: number, y: number): UnquantisedAndDenormaliseUnsigned {
        return this.setterUnquantizeAndDenormalizeUnsigned(x, y);
    }

    normalizeAndQuantizeSigned(x: number, y: number): NormaliseAndQuantiseSigned {
        return this.setterNormalizeAndQuantizeSigned(x, y);
    }

    setupNormalizeAndQuantize() {
        this.playerElement = this.videoElementProvider.getVideoParentElement();
        this.videoElement = this.videoElementProvider.getVideoElement() as any;

        if (this.playerElement && this.videoElement) {
            let playerAspectRatio = this.playerElement.clientHeight / this.playerElement.clientWidth;
            let videoAspectRatio = this.videoElement.videoHeight / this.videoElement.videoWidth;

            if (playerAspectRatio > videoAspectRatio) {
                Logger.Log(Logger.GetStackTrace(), 'Setup Normalize and Quantize for playerAspectRatio > videoAspectRatio', 6);
                this.ratio = playerAspectRatio / videoAspectRatio;
                this.setterNormalizeAndQuantizeUnsigned = (x: number, y: number) => this.overRideNormalizeAndQuantizeUnsigned(x, y);
                this.setterUnquantizeAndDenormalizeUnsigned = (x: number, y: number) => this.overRideUnquantizeAndDenormalizeUnsigned(x, y);
                this.setterNormalizeAndQuantizeSigned = (x: number, y: number) => this.overRideNormalizeAndQuantizeSigned(x, y);
            } else {
                Logger.Log(Logger.GetStackTrace(), 'Setup Normalize and Quantize for playerAspectRatio <= videoAspectRatio', 6);
                this.ratio = videoAspectRatio / playerAspectRatio;
                this.setterNormalizeAndQuantizeUnsigned = (x: number, y: number) => this.overRideNormalizeAndQuantizeUnsignedAlt(x, y);
                this.setterUnquantizeAndDenormalizeUnsigned = (x: number, y: number) => this.overRideUnquantizeAndDenormalizeUnsignedAlt(x, y);
                this.setterNormalizeAndQuantizeSigned = (x: number, y: number) => this.overRideNormalizeAndQuantizeSignedAlt(x, y);
            }

        }
    }

    setterNormalizeAndQuantizeUnsigned(x: number, y: number): NormaliseAndQuantiseUnsigned {
        throw new Error("Method not implemented.");
    }

    setterUnquantizeAndDenormalizeUnsigned(x: number, y: number): UnquantisedAndDenormaliseUnsigned {
        throw new Error("Method not implemented.");
    }

    setterNormalizeAndQuantizeSigned(x: number, y: number): NormaliseAndQuantiseSigned {
        throw new Error("Method not implemented.");
    }

    // overrides 
    overRideNormalizeAndQuantizeUnsigned(x: number, y: number): NormaliseAndQuantiseUnsigned {
        let normalizedX = x / this.playerElement.clientWidth;
        let normalizedY = this.ratio * (y / this.playerElement.clientHeight - 0.5) + 0.5;
        if (normalizedX < 0.0 || normalizedX > 1.0 || normalizedY < 0.0 || normalizedY > 1.0) {
            return new NormaliseAndQuantiseUnsigned(false, 65535, 65535);
        } else {
            return new NormaliseAndQuantiseUnsigned(true, normalizedX * 65536, normalizedY * 65536);
        }
    }

    overRideUnquantizeAndDenormalizeUnsigned(x: number, y: number) {
        let normalizedX = x / 65536;
        let normalizedY = (y / 65536 - 0.5) / this.ratio + 0.5;
        return new UnquantisedAndDenormaliseUnsigned(normalizedX * this.playerElement.clientWidth, normalizedY * this.playerElement.clientHeight);
    }

    overRideNormalizeAndQuantizeSigned(x: number, y: number) {
        let normalizedX = x / (0.5 * this.playerElement.clientWidth);
        let normalizedY = (this.ratio * y) / (0.5 * this.playerElement.clientHeight);
        return new NormaliseAndQuantiseSigned(normalizedX * 32767, normalizedY * 32767);
    }

    // Overrides alt
    overRideNormalizeAndQuantizeUnsignedAlt(x: number, y: number) {
        let normalizedX = this.ratio * (x / this.playerElement.clientWidth - 0.5) + 0.5;
        let normalizedY = y / this.playerElement.clientHeight;
        if (normalizedX < 0.0 || normalizedX > 1.0 || normalizedY < 0.0 || normalizedY > 1.0) {
            return new NormaliseAndQuantiseUnsigned(false, 65535, 65535);
        } else {
            return new NormaliseAndQuantiseUnsigned(true, normalizedX * 65536, normalizedY * 65536);
        }
    }

    overRideUnquantizeAndDenormalizeUnsignedAlt(x: number, y: number) {
        let normalizedX = (x / 65536 - 0.5) / this.ratio + 0.5;
        let normalizedY = y / 65536;
        return new UnquantisedAndDenormaliseUnsigned(normalizedX * this.playerElement.clientWidth, normalizedY * this.playerElement.clientHeight);
    }

    overRideNormalizeAndQuantizeSignedAlt(x: number, y: number) {
        let normalizedX = (this.ratio * x) / (0.5 * this.playerElement.clientWidth);
        let normalizedY = y / (0.5 * this.playerElement.clientHeight);
        return new NormaliseAndQuantiseSigned(normalizedX * 32767, normalizedY * 32767);
    }
}

export class NormaliseAndQuantiseUnsigned {
    inRange: boolean;
    x: number;
    y: number;

    constructor(inRange: boolean, x: number, y: number) {
        this.inRange = inRange;
        this.x = x;
        this.y = y;
    }
}

/**
 * Denormalised and unquantised Unsigned Data
 */
export class UnquantisedAndDenormaliseUnsigned {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

/**
 * Normalised and Quantised Signed Data
 */
export class NormaliseAndQuantiseSigned {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}