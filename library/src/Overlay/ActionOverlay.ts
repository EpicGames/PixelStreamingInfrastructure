import { IOverlay } from "./IOverlay";
import { EventEmitter } from "events";

/**
 * The abstract class for action overlays 
 */
export abstract class ActionOverlay implements IOverlay {
    
    // the event emitter object 
    private eventEmitter: EventEmitter;

    constructor() {
        this.eventEmitter = new EventEmitter();
    }

    /**
     * Show the overlay 
     */
    public abstract show(): void;

    /**
     * Hide the overlay 
     */
    public abstract hide(): void;

    /**
     * Set a method as an event emitter callback 
     * @param callBack the method that is to be called when the event is emitted 
     */
    onAction(callBack: (...args: any[]) => void) {
        this.eventEmitter.on("action", callBack);
    }

    /**
     * Activate an event that is attached to the event emitter 
     */
    activate() {
        this.eventEmitter.emit("action");
    }
}