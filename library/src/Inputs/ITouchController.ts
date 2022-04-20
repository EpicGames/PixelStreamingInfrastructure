/**
 * The interface for touch controllers
 */
export interface ITouchController {
    onTouchStart(touch: TouchEvent): void;
    onTouchEnd(touch: TouchEvent): void;
    onTouchMove(touch: TouchEvent): void;
}