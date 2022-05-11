/**
 * The interface for AfkOverlayController 
 */
 export interface IAfkOverlayController {
    /**
     * An override method for setting the Afk Overlay 
     */
     afkSetOverlay(): void;

     /**
      * An override method for hiding the Afk overlay
      */
     afkHideOverlay(): void;
 
     /**
      * An override method for closing the websocket within the AfkOverlayController
      */
     afkCloseWs(): void;
}