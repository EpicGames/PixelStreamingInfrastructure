import { IActionOverlay } from "./IActionOverlay";

/**
 * The abstract class for the Afk overlay 
 */
export interface IAfkOverlay extends IActionOverlay {

    /**
     * update the countdown number for the afk overlay 
     * @param countdown the countdown number to be updated 
     */
    update(countdown: number): void;
}