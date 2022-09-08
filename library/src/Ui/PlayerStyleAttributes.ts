import { IPlayerStyleAttributes } from "./IPlayerStyleAttributes";

export class PlayerStyleAttributes implements IPlayerStyleAttributes {
    styleWidth: number;
    styleHeight: number;
    styleTop: number;
    styleLeft: number;
    styleCursor = 'default';
    styleAdditional: number;

    constructor() { }

    getStyleWidth() {
        return this.styleWidth;
    }

    getStyleHeight() {
        return this.styleHeight;
    }
}