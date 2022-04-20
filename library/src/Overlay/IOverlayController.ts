/**
 * The interface for the overly controller 
 */
export interface IOverlayController {
    shouldShowPlayOverlay: boolean;
    showPlayOverlay(event: EventListener): void;
}