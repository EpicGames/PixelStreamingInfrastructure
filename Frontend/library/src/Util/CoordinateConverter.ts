// Copyright Epic Games, Inc. All Rights Reserved.

import { Logger } from '../Logger/Logger';
import { VideoPlayer } from '../VideoPlayer/VideoPlayer';

/**
 * Converts coordinates from element relative coordinates to values normalized within the value range of a short (and back again)
 */
export class CoordinateConverter {
    videoElementProvider: VideoPlayer;
    videoElementParent: HTMLElement;
    videoElement: HTMLVideoElement;
    ratio: number;

    normalizeAndQuantizeUnsignedFunc: (
        x: number,
        y: number
    ) => NormalizedQuantizedUnsignedCoord;
    normalizeAndQuantizeSignedFunc: (
        x: number,
        y: number
    ) => NormalizedQuantizedSignedCoord;
    denormalizeAndUnquantizeUnsignedFunc: (
        x: number,
        y: number
    ) => UnquantizedDenormalizedUnsignedCoord;

    /**
     * @param videoElementProvider - the div element that the video player will be injected into
     */
    constructor(videoElementProvider: VideoPlayer) {
        this.videoElementProvider = videoElementProvider;
        this.normalizeAndQuantizeUnsignedFunc = () => {
            throw new Error(
                'Normalize and quantize unsigned, method not implemented.'
            );
        };
        this.normalizeAndQuantizeSignedFunc = () => {
            throw new Error(
                'Normalize and unquantize signed, method not implemented.'
            );
        };
        this.denormalizeAndUnquantizeUnsignedFunc = () => {
            throw new Error(
                'Denormalize and unquantize unsigned, method not implemented.'
            );
        };
    }

    /**
     * The surface method for setterNormalizeAndQuantizeUnsigned
     * @param x - x axis point
     * @param y - y axis point
     */
    normalizeAndQuantizeUnsigned(
        x: number,
        y: number
    ): NormalizedQuantizedUnsignedCoord {
        return this.normalizeAndQuantizeUnsignedFunc(x, y);
    }

    /**
     * The surface method for setterUnquantizeAndDenormalizeUnsigned
     * @param x - x axis point
     * @param y - y axis point
     */
    unquantizeAndDenormalizeUnsigned(
        x: number,
        y: number
    ): UnquantizedDenormalizedUnsignedCoord {
        return this.denormalizeAndUnquantizeUnsignedFunc(x, y);
    }

    /**
     * The surface method for setterNormalizeAndQuantizeSigned
     * @param x - x axis point
     * @param y - y axis point
     */
    normalizeAndQuantizeSigned(
        x: number,
        y: number
    ): NormalizedQuantizedSignedCoord {
        return this.normalizeAndQuantizeSignedFunc(x, y);
    }

    /**
     * set up the Normalize And Quantize methods based on the aspect ratio and the video player ratio
     */
    setupNormalizeAndQuantize() {
        this.videoElementParent =
            this.videoElementProvider.getVideoParentElement();
        this.videoElement = this.videoElementProvider.getVideoElement();

        if (this.videoElementParent && this.videoElement) {
            const playerAspectRatio =
                this.videoElementParent.clientHeight /
                this.videoElementParent.clientWidth;
            const videoAspectRatio =
                this.videoElement.videoHeight / this.videoElement.videoWidth;
            if (playerAspectRatio > videoAspectRatio) {
                Logger.Log(
                    Logger.GetStackTrace(),
                    'Setup Normalize and Quantize for playerAspectRatio > videoAspectRatio',
                    6
                );
                this.ratio = playerAspectRatio / videoAspectRatio;
                this.normalizeAndQuantizeUnsignedFunc = (
                    x: number,
                    y: number
                ) => this.normalizeAndQuantizeUnsignedPlayerBigger(x, y);
                this.normalizeAndQuantizeSignedFunc = (x: number, y: number) =>
                    this.normalizeAndQuantizeSignedPlayerBigger(x, y);
                this.denormalizeAndUnquantizeUnsignedFunc = (
                    x: number,
                    y: number
                ) => this.denormalizeAndUnquantizeUnsignedPlayerBigger(x, y);
            } else {
                Logger.Log(
                    Logger.GetStackTrace(),
                    'Setup Normalize and Quantize for playerAspectRatio <= videoAspectRatio',
                    6
                );
                this.ratio = videoAspectRatio / playerAspectRatio;
                this.normalizeAndQuantizeUnsignedFunc = (
                    x: number,
                    y: number
                ) => this.normalizeAndQuantizeUnsignedPlayerSmaller(x, y);
                this.normalizeAndQuantizeSignedFunc = (x: number, y: number) =>
                    this.normalizeAndQuantizeSignedPlayerSmaller(x, y);
                this.denormalizeAndUnquantizeUnsignedFunc = (
                    x: number,
                    y: number
                ) => this.denormalizeAndUnquantizeUnsignedPlayerSmaller(x, y);
            }
        }
    }

    /**
     * normalizeAndQuantizeUnsigned for playerAspectRatio > videoAspectRatio
     * @param x - x axis point
     * @param y - y axis point
     */
    normalizeAndQuantizeUnsignedPlayerBigger(
        x: number,
        y: number
    ): NormalizedQuantizedUnsignedCoord {
        const normalizedX = x / this.videoElementParent.clientWidth;
        const normalizedY =
            this.ratio * (y / this.videoElementParent.clientHeight - 0.5) + 0.5;
        if (
            normalizedX < 0.0 ||
            normalizedX > 1.0 ||
            normalizedY < 0.0 ||
            normalizedY > 1.0
        ) {
            return new NormalizedQuantizedUnsignedCoord(false, 65535, 65535);
        } else {
            return new NormalizedQuantizedUnsignedCoord(
                true,
                normalizedX * 65536,
                normalizedY * 65536
            );
        }
    }

    /**
     * unquantizeAndDenormalizeUnsigned for playerAspectRatio > videoAspectRatio
     * @param x - x axis point
     * @param y - y axis point
     */
    denormalizeAndUnquantizeUnsignedPlayerBigger(x: number, y: number) {
        const normalizedX = x / 65536;
        const normalizedY = (y / 65536 - 0.5) / this.ratio + 0.5;
        return new UnquantizedDenormalizedUnsignedCoord(
            normalizedX * this.videoElementParent.clientWidth,
            normalizedY * this.videoElementParent.clientHeight
        );
    }

    /**
     * normalizeAndQuantizeSigned for playerAspectRatio > videoAspectRatio
     * @param x - x axis point
     * @param y - y axis point
     */
    normalizeAndQuantizeSignedPlayerBigger(x: number, y: number) {
        const normalizedX = x / (0.5 * this.videoElementParent.clientWidth);
        const normalizedY =
            (this.ratio * y) / (0.5 * this.videoElementParent.clientHeight);
        return new NormalizedQuantizedSignedCoord(
            normalizedX * 32767,
            normalizedY * 32767
        );
    }

    /**
     * normalizeAndQuantizeUnsigned for playerAspectRatio <= videoAspectRatio
     * @param x - x axis point
     * @param y - y axis point
     */
    normalizeAndQuantizeUnsignedPlayerSmaller(x: number, y: number) {
        const normalizedX =
            this.ratio * (x / this.videoElementParent.clientWidth - 0.5) + 0.5;
        const normalizedY = y / this.videoElementParent.clientHeight;
        if (
            normalizedX < 0.0 ||
            normalizedX > 1.0 ||
            normalizedY < 0.0 ||
            normalizedY > 1.0
        ) {
            return new NormalizedQuantizedUnsignedCoord(false, 65535, 65535);
        } else {
            return new NormalizedQuantizedUnsignedCoord(
                true,
                normalizedX * 65536,
                normalizedY * 65536
            );
        }
    }

    /**
     * unquantizeAndDenormalizeUnsigned for playerAspectRatio <= videoAspectRatio
     * @param x - x axis point
     * @param y - y axis point
     */
    denormalizeAndUnquantizeUnsignedPlayerSmaller(x: number, y: number) {
        const normalizedX = (x / 65536 - 0.5) / this.ratio + 0.5;
        const normalizedY = y / 65536;
        return new UnquantizedDenormalizedUnsignedCoord(
            normalizedX * this.videoElementParent.clientWidth,
            normalizedY * this.videoElementParent.clientHeight
        );
    }

    /**
     * normalizeAndQuantizeSigned for playerAspectRatio <= videoAspectRatio
     * @param x - x axis point
     * @param y - y axis point
     */
    normalizeAndQuantizeSignedPlayerSmaller(x: number, y: number) {
        const normalizedX =
            (this.ratio * x) / (0.5 * this.videoElementParent.clientWidth);
        const normalizedY = y / (0.5 * this.videoElementParent.clientHeight);
        return new NormalizedQuantizedSignedCoord(
            normalizedX * 32767,
            normalizedY * 32767
        );
    }
}

/**
 * A class for NormalizeAndQuantizeUnsigned objects
 */
export class NormalizedQuantizedUnsignedCoord {
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
 * A class for UnquantizedAndDenormalizeUnsigned objects
 */
export class UnquantizedDenormalizedUnsignedCoord {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

/**
 * A class for NormalizedQuantizedSignedCoord objects
 */
export class NormalizedQuantizedSignedCoord {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}
