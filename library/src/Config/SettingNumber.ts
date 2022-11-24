/**
 * A number spinner with a text label beside it.
 */
 export class SettingNumber {
	_id: string;
	_label: string;
	_description: string;
	_number: number;
	_min: number;
	_max: number;
	_rootElement: HTMLElement;
	_spinner: HTMLInputElement;
	_onChange: (newNumber: number) => void;

	constructor(id: string, label: string, description: string, min: number, max: number, defaultNumber: number) {
		this._id = id;
		this._label = label;
		this._description = description;
		this._min = min;
		this._max = max;
		this._number = defaultNumber;

		// attempt to read the number from the url params
		const urlParams = new URLSearchParams(window.location.search);
		if(urlParams.has(this.id)){
			const parsedValue = Number.parseInt(urlParams.get(this.id));
			if(!Number.isNaN(parsedValue)) {
				this._number = parsedValue;
			}
		}

		// setup onchange
		this.spinner.onchange = (event : Event) => {
			const inputElem = event.target as HTMLInputElement;

			const parsedValue = Number.parseInt(inputElem.value);

			if(Number.isNaN(parsedValue)) {
				console.warn(`Could not parse value change into a valid number - value was ${inputElem.value}, resetting value to ${this._min}`);
				this.number = this._min;
			} else {
				const clampedValue = this.clamp(parsedValue);
				this._number = clampedValue;
				this._spinner.value = clampedValue.toString();
				this.updateURLParams();
			}

			// call onchange if we have set it
			if(this._onChange) {
				this._onChange(this._number);
			}
		};

	}

	/**
	 * @returns The id of this numeric setting.
	 */
	public get id() : string {
		return this._id;
	}

	/**
	 * Set the number in the spinner (will be clamped within range).
	 */
	public set number(newNumber: number){
		this._number = this.clamp(newNumber);
		this.spinner.value = this._number.toString();
	}

	/**
	 * @returns The number stored in the spinner.
	 */
	public get number() : number {
		return this._number;
	}

	/**
	 * Clamps a number between the min and max values (inclusive).
	 * @param inNumber The number to clamp.
	 * @returns The clamped number.
	 */
	public clamp(inNumber: number) : number {
		return Math.max(Math.min(this._max, inNumber), this._min);
	}

	/**
	 * Add a change listener to the spinner element.
	 */
	public addOnChangedListener(onChangedFunc: (newNumber: number) => void) {
		this._onChange = onChangedFunc;
	}

	public updateURLParams() : void {
		// set url params like ?id=number
		const urlParams = new URLSearchParams(window.location.search);
		urlParams.set(this.id, this._number.toString());
		window.history.replaceState({}, '', urlParams.toString() !== "" ? `${location.pathname}?${urlParams}` : `${location.pathname}`);
	}

	/**
	 * Get the HTMLInputElement for the button.
	 */
	public get spinner() : HTMLInputElement {
		if(!this._spinner) {
			this._spinner = document.createElement("input");
			this._spinner.type = "number";
			this._spinner.min = this._min.toString();
			this._spinner.max = this._max.toString();
			this._spinner.value = this._number.toString();
			this._spinner.title = this._description;
            this._spinner.classList.add("form-control");
		}
		return this._spinner;
	}

	/**
	* @returns Return or creates a HTML element that represents this setting in the DOM.
	*/
	public get rootElement() : HTMLElement {
		if(!this._rootElement) {

			// create root div with "setting" css class
            this._rootElement = document.createElement("div");
            this._rootElement.classList.add("setting");
			this._rootElement.classList.add("form-group");

            // create div element to contain our setting's text
			const settingsTextElem = document.createElement("label");
            settingsTextElem.innerText = this._label;
			settingsTextElem.title = this._description;
            this._rootElement.appendChild(settingsTextElem);

            // create label element to wrap out input type
            this._rootElement.appendChild(this.spinner);

		}
		return this._rootElement;
	}
}