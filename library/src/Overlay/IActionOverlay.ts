import { IOverlay } from "./IOverlay";
import { EventEmitter } from "events";
import { ITextOverlay } from "./ITextOverlay";

/**
 * The abstract class for action overlays 
 */
export interface IActionOverlay extends IOverlay {

    // the event emitter object 
    eventEmitter: EventEmitter;

    update(updateText: string): void;

    /**
      * Set a method as an event emitter callback 
      * @param callBack the method that is to be called when the event is emitted 
      */
    onAction(callBack: (...args: any[]) => void): void;

    /**
     * Activate an event that is attached to the event emitter 
     */
    activate(): void;
}