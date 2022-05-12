/**
 * The interface for Overlay 
 */
export interface IOverlay {

    //shouldShowPlayOverlay: boolean;

    /**
     * An override function that users can pass in custom functionality for when an overlay shows 
     */
    onShowOverlay(): void;

    /**
     * An override function that users can pass in custom functionality for when an overlay hides 
     */
    onHideOverlay(): void;
}