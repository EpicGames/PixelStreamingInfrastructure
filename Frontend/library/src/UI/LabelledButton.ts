// Copyright Epic Games, Inc. All Rights Reserved.

/**
 * A button with a text label beside it.
 */
export class LabelledButton {
    _label: string;
    _buttonText: string;
    _rootElement: HTMLElement;
    _button: HTMLInputElement;

    constructor(label: string, buttonText: string) {
        this._label = label;
        this._buttonText = buttonText;
    }

    /**
     * Add a click listener to the button element.
     */
    public addOnClickListener(onClickFunc: () => void) {
        this.button.addEventListener('click', onClickFunc);
    }

    /**
     * Get the HTMLInputElement for the button.
     */
    public get button(): HTMLInputElement {
        if (!this._button) {
            this._button = document.createElement('input');
            this._button.type = 'button';
            this._button.value = this._buttonText;
            this._button.classList.add('overlay-button');
            this._button.classList.add('btn-flat');
        }
        return this._button;
    }

    /**
     * @returns Return or creates a HTML element that represents this setting in the DOM.
     */
    public get rootElement(): HTMLElement {
        if (!this._rootElement) {
            // create root div with "setting" css class
            this._rootElement = document.createElement('div');
            this._rootElement.classList.add('setting');

            // create div element to contain our setting's text
            const settingsTextElem = document.createElement('div');
            settingsTextElem.innerText = this._label;
            this._rootElement.appendChild(settingsTextElem);

            // create label element to wrap out input type
            const wrapperLabel = document.createElement('label');
            wrapperLabel.classList.add('btn-overlay');
            this._rootElement.appendChild(wrapperLabel);

            wrapperLabel.appendChild(this.button);
        }
        return this._rootElement;
    }
}
