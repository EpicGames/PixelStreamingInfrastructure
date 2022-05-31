import { ActionOverlay } from "./ActionOverlay";

/**
 * The abstract class for the Afk overlay 
 */
export abstract class AfkOverlay extends ActionOverlay {

    /**
     * update the countdown number for the afk overlay 
     * @param countdown the countdown number to be updated 
     */
    public abstract update(countdown: number): void;
}