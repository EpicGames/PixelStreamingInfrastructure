/**
 * An interface for managing the current player windows attributes
 */
export interface IPlayerStyleAttributes {
    styleWidth: number;
    styleHeight: number;
    styleTop: number;
    styleLeft: number;
    styleCursor: string;
    styleAdditional: number;

    /**
     * Get the width of the current player window
     * @returns - the width of the current player window
     */
    getStyleWidth(): number;

    /**
     * Get the height of the current player window
     * @returns - the height of the current player window
     */
    getStyleHeight(): number;
}