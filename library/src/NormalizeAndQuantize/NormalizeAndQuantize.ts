import { Logger } from "../Logger/Logger";
import { VideoPlayer } from "../VideoPlayer/VideoPlayer";

export class NormalizeAndQuantize {
    videoElementProvider: VideoPlayer;
    videoElementParent: HTMLElement;
    videoElement: HTMLVideoElement;
    ratio: number;

    /**
     * @param videoElementProvider - the div element that the video player will be injected into 
     */
    constructor(videoElementProvider: VideoPlayer) {
        this.videoElementProvider = videoElementProvider;
    }

    /**
     * The surface method for setterNormalizeAndQuantizeUnsigned
     * @param x - x axis point
     * @param y - y axis point 
     */
    normalizeAndQuantizeUnsigned(x: number, y: number): NormaliseAndQuantiseUnsigned {
        return this.setterNormalizeAndQuantizeUnsigned(x, y);
    }

    /**
     * The surface method for setterUnquantizeAndDenormalizeUnsigned
     * @param x - x axis point
     * @param y - y axis point 
     */
    unquantizeAndDenormalizeUnsigned(x: number, y: number): UnquantisedAndDenormaliseUnsigned {
        return this.setterUnquantizeAndDenormalizeUnsigned(x, y);
    }

    /**
     * The surface method for setterNormalizeAndQuantizeSigned
     * @param x - x axis point
     * @param y - y axis point 
     */
    normalizeAndQuantizeSigned(x: number, y: number): NormaliseAndQuantiseSigned {
        return this.setterNormalizeAndQuantizeSigned(x, y);
    }

    /**
     * set up the Normalize And Quantize methods based on the aspect ratio and the video player ratio
     */
    setupNormalizeAndQuantize() {
        this.videoElementParent = this.videoElementProvider.getVideoParentElement();
        this.videoElement = this.videoElementProvider.getVideoElement() as any;

        if (this.videoElementParent && this.videoElement) {
            const playerAspectRatio = this.videoElementParent.clientHeight / this.videoElementParent.clientWidth;
            const videoAspectRatio = this.videoElement.videoHeight / this.videoElement.videoWidth;
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

    /**
    * A setter method for normalizeAndQuantizeUnsigned
    * @param x - x axis point
    * @param y - y axis point 
    */
    setterNormalizeAndQuantizeUnsigned(x: number, y: number): NormaliseAndQuantiseUnsigned {
        throw new Error("Method not implemented.");
    }

    /**
     * A setter method for unquantizeAndDenormalizeUnsigned
     * @param x - x axis point
     * @param y - y axis point 
     */
    setterUnquantizeAndDenormalizeUnsigned(x: number, y: number): UnquantisedAndDenormaliseUnsigned {
        throw new Error("Method not implemented.");
    }

    /**
     * A setter method for normalizeAndQuantizeSigned
     * @param x - x axis point
     * @param y - y axis point 
     */
    setterNormalizeAndQuantizeSigned(x: number, y: number): NormaliseAndQuantiseSigned {
        throw new Error("Method not implemented.");
    }

    /**
    * normalizeAndQuantizeUnsigned for playerAspectRatio > videoAspectRatio
    * @param x - x axis point
    * @param y - y axis point 
    */
    overRideNormalizeAndQuantizeUnsigned(x: number, y: number): NormaliseAndQuantiseUnsigned {
        const normalizedX = x / this.videoElementParent.clientWidth;
        const normalizedY = this.ratio * (y / this.videoElementParent.clientHeight - 0.5) + 0.5;
        if (normalizedX < 0.0 || normalizedX > 1.0 || normalizedY < 0.0 || normalizedY > 1.0) {
            return new NormaliseAndQuantiseUnsigned(false, 65535, 65535);
        } else {
            return new NormaliseAndQuantiseUnsigned(true, normalizedX * 65536, normalizedY * 65536);
        }
    }

    /**
    * unquantizeAndDenormalizeUnsigned for playerAspectRatio > videoAspectRatio
    * @param x - x axis point
    * @param y - y axis point 
    */
    overRideUnquantizeAndDenormalizeUnsigned(x: number, y: number) {
        const normalizedX = x / 65536;
        const normalizedY = (y / 65536 - 0.5) / this.ratio + 0.5;
        return new UnquantisedAndDenormaliseUnsigned(normalizedX * this.videoElementParent.clientWidth, normalizedY * this.videoElementParent.clientHeight);
    }

    /**
    * normalizeAndQuantizeSigned for playerAspectRatio > videoAspectRatio
    * @param x - x axis point
    * @param y - y axis point 
    */
    overRideNormalizeAndQuantizeSigned(x: number, y: number) {
        const normalizedX = x / (0.5 * this.videoElementParent.clientWidth);
        const normalizedY = (this.ratio * y) / (0.5 * this.videoElementParent.clientHeight);
        return new NormaliseAndQuantiseSigned(normalizedX * 32767, normalizedY * 32767);
    }

    /**
    * normalizeAndQuantizeUnsigned for playerAspectRatio <= videoAspectRatio
    * @param x - x axis point
    * @param y - y axis point 
    */
    overRideNormalizeAndQuantizeUnsignedAlt(x: number, y: number) {
        const normalizedX = this.ratio * (x / this.videoElementParent.clientWidth - 0.5) + 0.5;
        const normalizedY = y / this.videoElementParent.clientHeight;
        if (normalizedX < 0.0 || normalizedX > 1.0 || normalizedY < 0.0 || normalizedY > 1.0) {
            return new NormaliseAndQuantiseUnsigned(false, 65535, 65535);
        } else {
            return new NormaliseAndQuantiseUnsigned(true, normalizedX * 65536, normalizedY * 65536);
        }
    }

    /**
    * unquantizeAndDenormalizeUnsigned for playerAspectRatio <= videoAspectRatio
    * @param x - x axis point
    * @param y - y axis point 
    */
    overRideUnquantizeAndDenormalizeUnsignedAlt(x: number, y: number) {
        const normalizedX = (x / 65536 - 0.5) / this.ratio + 0.5;
        const normalizedY = y / 65536;
        return new UnquantisedAndDenormaliseUnsigned(normalizedX * this.videoElementParent.clientWidth, normalizedY * this.videoElementParent.clientHeight);
    }

    /**
    * normalizeAndQuantizeSigned for playerAspectRatio <= videoAspectRatio
    * @param x - x axis point
    * @param y - y axis point 
    */
    overRideNormalizeAndQuantizeSignedAlt(x: number, y: number) {
        const normalizedX = (this.ratio * x) / (0.5 * this.videoElementParent.clientWidth);
        const normalizedY = y / (0.5 * this.videoElementParent.clientHeight);
        return new NormaliseAndQuantiseSigned(normalizedX * 32767, normalizedY * 32767);
    }
}

/**
 * A class for NormaliseAndQuantiseUnsigned objects
 */
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
 * A class for UnquantisedAndDenormaliseUnsigned objects
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
 * A class for NormaliseAndQuantiseSigned objects
 */
export class NormaliseAndQuantiseSigned {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}