// Copyright Epic Games, Inc. All Rights Reserved.

import { Config, PixelStreaming } from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.2';
import { Application, PixelStreamingApplicationStyle } from '@epicgames-ps/lib-pixelstreamingfrontend-ui-ue5.2';
export const PixelStreamingApplicationStyles = new PixelStreamingApplicationStyle();


document.body.onload = function() {
	// Example of how to set the logger level
	// Logger.SetLoggerVerbosity(10);

	// Create a config object
	const config = new Config({ useUrlParams: true });

	// Create Pixel Streaming application
	const pixelStreaming = new PixelStreaming(config);
	const application = new Application({ pixelStreaming });
	document.getElementById("playercontainer").appendChild(application.rootElement);

	const showcase = new Showcase();

	// Bind example selection to the onExampleChanged function
	document.getElementById("exampleSelect").onchange = (event : Event) => { showcase.onExampleChanged(event); };


}

class Showcase {

	private _infoElem : HTMLElement;
	private _exampleSettingsElem : HTMLElement;

	constructor () {
		this._infoElem = document.getElementById("infoinstructions") as HTMLElement;
		this._exampleSettingsElem = document.getElementById("sidebarContent") as HTMLElement;
		this._createGettingStartedExample();
	}

	/**
	 * Event fired for when the selection drop down containing our showcase examples changes.
	 * @param event The change event.
	 */
	onExampleChanged(event : Event) : void {

		if(!event) { return; }

		const selectElement = event.target as HTMLSelectElement;
		const exampleName = selectElement.value;
		console.log(exampleName);
		this._createExample(exampleName);
	}

	private _createExample(exampleName : string) {

		// clear example elements
		while (this._exampleSettingsElem.lastElementChild) {
			this._exampleSettingsElem.removeChild(this._exampleSettingsElem.lastElementChild);
		}

		// create the relevant example based on the string passed in
		switch(exampleName) {
			case "Send UE Data":
				this._createSendUEDataExample();
				break;
			case "Getting Started":
				this._createGettingStartedExample();
				break;
			case "Trigger UE Commands":
				this._createUECommandExample();
				break;
			default:
				break;
		}
	}

	private _createGettingStartedExample() {
		this._infoElem.innerHTML = 
		`
		<p>Welcome to the Pixel Streaming demo showcase!</p>
		<p> <u>Getting Started</u> </p>
		<ol>
			<li>Run the Unreal Engine Pixel Streaming demo project with launch args for this server, example: -PixelStreamingUrl=ws://localhost:8888.</li>
			<li>Click the "click to start" text on this page to start streaming.</li>
			<li>Use the drop down to select an example.</li>
			<li>Use control panel on the left to interact with the example.</li>
		</ol>
		`;
	}
	
	private _createSendUEDataExample() {

		this._infoElem.innerHTML = 
		`
		<p> <u>Example: Sending data to Unreal Engine</u> </p>
		<ol>
			<li>Click the character portraits to change character.</li>
			<li>Click the skins to change character skins.</li>
		</ol>
		<p>Under the hood these interactions use the WebRTC data channel to send a data payload that we interpret on the UE side and respond to appropriately.</p>
		<p>In particular the function called to send custom data to Unreal Engine from the frontend is:</p>
		<code>pixelstreaming.emitUIInteraction(data: object | string)</code>
		`;

		const characterSelectElem = document.createElement("div");
		this._exampleSettingsElem.appendChild(characterSelectElem);

		const characterSelectTitle = document.createElement("p");
		characterSelectTitle.innerText = "Select a character: ";
		characterSelectElem.appendChild(characterSelectTitle);

		// Make Aurora character
		const auroraElem = document.createElement("div");
		characterSelectElem.appendChild(auroraElem);
		// todo: onclick=onCOnfigButton(0,0)
		const auroraImg = document.createElement("img");
		auroraImg.classList.add("characterBtn");
		auroraImg.src = "./images/Aurora.jpg";
		auroraElem.appendChild(auroraImg);

		// Make Crunch character
		const crunchElem = document.createElement("div");
		characterSelectElem.appendChild(crunchElem);
		// todo: onclick=onCOnfigButton(0,1)
		const crunchImg = document.createElement("img");
		crunchImg.classList.add("characterBtn");
		crunchImg.src = "./images/Crunch.jpg";
		crunchElem.appendChild(crunchImg);

		// Make skin selection title
		const skinSelectTitle = document.createElement("p");
		skinSelectTitle.innerText = "Select a skin: ";
		this._exampleSettingsElem.appendChild(skinSelectTitle);

		// Make skin selection
		const skinSelectElem = document.createElement("div");
		skinSelectElem.classList.add("spaced-row");
		this._exampleSettingsElem.appendChild(skinSelectElem);

		// Make skin selection buttons

		// Skin1
		const skin1Btn = document.createElement("button");
		skin1Btn.classList.add("btn-flat");
		// todo: onclick=onConfigButton(1,0)
		skin1Btn.innerText = "Skin 1";
		skinSelectElem.appendChild(skin1Btn);

		// Skin2
		const skin2Btn = document.createElement("button");
		skin2Btn.classList.add("btn-flat");
		// todo: onclick=onConfigButton(1,1)
		skin2Btn.innerText = "Skin 2";
		skinSelectElem.appendChild(skin2Btn);
	}

	private _createUECommandExample() {

		this._infoElem.innerHTML = 
		`
		<p> <u>Example: Triggering Commands in Unreal Engine</u> </p>
		<ul>
			<li>Click on the resolution buttons to change your Unreal Engine application's resolution (requires a <code>-windowed</code> application).</li>
		</ul>
		<p>Under the hood these interactions use the WebRTC data channel to send command messages that we interpret on the UE side to call specific UE functions.</p>
		<p>There are a very select set of built-in commands such as <i>changing resolution</i> and <i>change encoder QP</i>, which can be triggered like so:</p>
		<code>pixelStreaming.emitCommand({"Encoder.MinQP": 51,})</code>

		<p>However, you can bind your own custom commands in C++ using:</p>
		<code>
			// C++ side 
			</br>
			IPixelStreamingInputHandler::SetCommandHandler(const FString& CommandName, const TFunction<void(FString, FString)>& Handler)
			</br>
			// JS side
			</br>
			pixelstreaming.emitCommand({"MyCustomCommand": "MyCustomCommandParameter"});
		</code>

		<p>Additionally you can also trigger Unreal Engine console commands like <code>stat gpu</code> if you launch Pixel Streaming with <code>-AllowPixelStreamingCommands</code> then calling:</p>
		<code>pixelstreaming.emitConsoleCommand(command: string)</code>
		`;

		const changeResElem = document.createElement("div");
		this._exampleSettingsElem.appendChild(changeResElem);

		// Make res change title title
		const changeResTitle = document.createElement("p");
		changeResTitle.innerText = "Change resolution: ";
		changeResElem.appendChild(changeResTitle);

		// Make res change button container
		const changeResBtnContainer = document.createElement("div");
		changeResBtnContainer.classList.add("spaced-row");
		this._exampleSettingsElem.appendChild(changeResBtnContainer);

		// Make res change buttons

		// 720p
		const res720pBtn = document.createElement("button");
		res720pBtn.classList.add("btn-flat");
		// todo: onclick=onConfigButton(1,0)
		res720pBtn.innerText = "720p";
		changeResBtnContainer.appendChild(res720pBtn);

		// 1080p
		const res1080pBtn = document.createElement("button");
		res1080pBtn.classList.add("btn-flat");
		// todo: onclick=onConfigButton(1,0)
		res1080pBtn.innerText = "1080p";
		changeResBtnContainer.appendChild(res1080pBtn);

		// 4k
		const res4kBtn = document.createElement("button");
		res4kBtn.classList.add("btn-flat");
		// todo: onclick=onConfigButton(1,0)
		res4kBtn.innerText = "4k";
		changeResBtnContainer.appendChild(res4kBtn);
	}

}


