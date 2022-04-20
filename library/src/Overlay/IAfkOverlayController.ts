/**
 * The interface for the AFK overlay controller
 */
export interface IAfkOverlayController {
    afkSetOverlay(): void;
    afkHideOverlay(): void;
    afkCloseWs(): void;
}