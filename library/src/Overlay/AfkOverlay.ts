import { ActionOverlay } from "./ActionOverlay";

export abstract class AfkOverlay extends ActionOverlay {
    public abstract update(countdown: number): void;
}