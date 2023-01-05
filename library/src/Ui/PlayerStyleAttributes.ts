/**
 * A class for managing the current player windows attributes
 */
export class PlayerStyleAttributes {
    styleWidth: number;
    styleHeight: number;
    styleTop: number;
    styleLeft: number;
    styleCursor = 'default';
    styleAdditional: number;

    /**
     * Get the width of the current player window
     * @returns - the width of the current player window
     */
    getStyleWidth() {
        return this.styleWidth;
    }

    /**
     * Get the height of the current player window
     * @returns - the height of the current player window
     */
    getStyleHeight() {
        return this.styleHeight;
    }
}