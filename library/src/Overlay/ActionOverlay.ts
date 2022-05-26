import { IOverlay } from "./IOverlay";
import { EventEmitter } from "events";

export abstract class ActionOverlay implements IOverlay {

    private eventEmitter: EventEmitter;

    constructor() {
        this.eventEmitter = new EventEmitter();
    }

    public abstract show(): void;

    public abstract hide(): void;

    onAction(callBack: (...args: any[]) => void) {
        this.eventEmitter.on("action", callBack);
    }

    activate() {
        this.eventEmitter.emit("action");
    }
}