import { IOverlay } from "./IOverlay";

/**
 * The interface for text overlays 
 */
export interface ITextOverlay extends IOverlay {
    
    /**
     * Update the text for a text overlay 
     * @param text the text to be inserted into the overlay 
     */
    update(text: string): void;
}