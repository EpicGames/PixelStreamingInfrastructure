// Copyright Epic Games, Inc. All Rights Reserved.

import { Logger } from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.3';

import { OverlayBase } from './BaseOverlay';

/**
 * Class for the base action overlay structure
 */
export class ActionOverlay extends OverlayBase {
    onActionCallback: (...args: []) => void;

    /**
     * Construct an action overlay
     * @param rootDiv the root element this overlay will be inserted into
     * @param rootElement the root element that is the overlay
     * @param contentElement an element that contains text for the action overlay
     */
    public constructor(
        rootDiv: HTMLElement,
        rootElement: HTMLElement,
        contentElement: HTMLElement
    ) {
        super(rootDiv, rootElement, contentElement);
        this.onActionCallback = () => {
            /* do nothing */ Logger.Info(
                Logger.GetStackTrace(),
                'Did you forget to set the onAction callback in your overlay?'
            );
        };
    }

    /**
     * Update the text overlays inner text
     * @param text the update text to be inserted into the overlay
     */
    public update(text: string): void {
        if (text != null || text != undefined) {
            this.textElement.innerHTML = text;
        }
    }

    /**
     * Set a method as an event emitter callback
     * @param callBack the method that is to be called when the event is emitted
     */
    onAction(callBack: (...args: []) => void) {
        this.onActionCallback = callBack;
    }

    /**
     * Activate an event that is attached to the event emitter
     */
    activate() {
        this.onActionCallback();
    }
}
