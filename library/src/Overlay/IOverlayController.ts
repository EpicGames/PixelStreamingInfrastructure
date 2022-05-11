/**
 * The interface for OverlayController 
 */
export interface IOverlayController {

    shouldShowPlayOverlay: boolean;

    /**
    * Create a text overlay 
    * @param text the text you want your text overlay to display
    */
    showTextOverlay(text: string, progress?: number): void;

    /**
     * Shows the starting connect overlay
     * @param event the event listener you want to activate when you click this overlay
     */
    showConnectOverlay(event: EventListener): void;

    /**
    * Shows the play overlay
    *  @param event the event listener you want to activate when you click this overlay
    */
    showPlayOverlay(event: EventListener): void;
}