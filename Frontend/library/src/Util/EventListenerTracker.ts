// Copyright Epic Games, Inc. All Rights Reserved.

export type UnregisterFunction = () => void;

export class EventListenerTracker {
    private unregisterCallbacks: UnregisterFunction[];

    constructor() {
        this.unregisterCallbacks = [];
    }

    /**
     * Add a new callback that is executed when unregisterAll is called.
     * @param callback 
     */
    addUnregisterCallback(callback: UnregisterFunction) {
        this.unregisterCallbacks.push(callback);
    }

    /**
     * Execute all callbacks and clear the list.
     */
    unregisterAll() {
        for (const callback of this.unregisterCallbacks) {
            callback();
        }
        this.unregisterCallbacks = [];
    }
}
