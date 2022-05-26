import { IOverlay } from "./IOverlay";

export interface ITextOverlay extends IOverlay {
    update(text: string): void;
}