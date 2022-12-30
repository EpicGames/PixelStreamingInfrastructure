import * as libspsfrontend from '@tensorworks/libspsfrontend'

/**
 * Latency test UI elements and results handling.
 */
 export class LatencyTest {

	_rootElement: HTMLElement;
	_latencyTestButton: HTMLInputElement;
	_latencyTestResultsElement: HTMLElement;

	/**
	 * Construct a StatsIcon
	 */
	constructor() {

	}


	// <section id="latencyTest" class="settingsContainer">
	// 	<div id="latencyTestHeader" class="settings-text">
	// 		<div>Latency Test</div>
	// 		<input id="btn-start-latency-test" class="streamTools-button btn-flat"
	// 			type="button" value="Run Test">
	// 	</div>
	// 	<div id="latencyTestContainer" class="d-none">
	// 		<div id="latencyStatsResults" class="StatsResult"></div>
	// 	</div>
	// </section>

	/**
	 * Get the the button containing the stats icon.
	 */
	public get rootElement() : HTMLElement {
		if(!this._rootElement) {
			this._rootElement = document.createElement("section");
            this._rootElement.classList.add("settingsContainer");

			// make heading
			const heading = document.createElement("div");
			heading.id = "latencyTestHeader";
			heading.classList.add("settings-text");
			this._rootElement.appendChild(heading);

			const headingText = document.createElement("div");
			headingText.innerHTML = "Latency Test";
			heading.appendChild(headingText);
			heading.appendChild(this.latencyTestButton);

			// make test results element
			const resultsParentElem = document.createElement("div");
			resultsParentElem.id = "latencyTestContainer";
			resultsParentElem.classList.add("d-none");
			this._rootElement.appendChild(resultsParentElem);
			
			resultsParentElem.appendChild(this.latencyTestResultsElement);
			
		}
		return this._rootElement;
	}

	public get latencyTestResultsElement() : HTMLElement {
		if(!this._latencyTestResultsElement) {
			this._latencyTestResultsElement = document.createElement("div");
			this._latencyTestResultsElement.id = "latencyStatsResults";
			this._latencyTestResultsElement.classList.add("StatsResult");
		}
		return this._latencyTestResultsElement;
	}

	public get latencyTestButton() : HTMLInputElement {
		if(!this._latencyTestButton) {
			this._latencyTestButton = document.createElement("input");
			this._latencyTestButton.type = "button";
			this._latencyTestButton.value = "Run Test";
			this._latencyTestButton.id = "btn-start-latency-test";
			this._latencyTestButton.classList.add("streamTools-button");
			this._latencyTestButton.classList.add("btn-flat");
		}
		return this._latencyTestButton;
	}

	/**
	 * Populate the UI based on the latency test's results.
	 * @param latencyTimings The latency test results.
	 */
	public handleTestResult(latencyTimings: libspsfrontend.LatencyTestResults) {
		libspsfrontend.Logger.Log(libspsfrontend.Logger.GetStackTrace(), latencyTimings.toString(), 6);
		let latencyStatsInnerHTML = '';
		latencyStatsInnerHTML += "<div>Net latency RTT (ms): " + latencyTimings.networkLatency + "</div>";
		latencyStatsInnerHTML += "<div>UE Encode (ms): " + latencyTimings.EncodeMs + "</div>";
		latencyStatsInnerHTML += "<div>UE Capture (ms): " + latencyTimings.CaptureToSendMs + "</div>";
		latencyStatsInnerHTML += "<div>Browser send latency (ms): " + latencyTimings.browserSendLatency + "</div>";
		latencyStatsInnerHTML += latencyTimings.frameDisplayDeltaTimeMs && latencyTimings.browserReceiptTimeMs ? "<div>Browser receive latency (ms): " + latencyTimings.frameDisplayDeltaTimeMs + "</div>" : "";
		latencyStatsInnerHTML += "<div>Total latency (excluding browser) (ms): " + latencyTimings.latencyExcludingDecode + "</div>";
		latencyStatsInnerHTML += latencyTimings.endToEndLatency ? "<div>Total latency (ms): " + latencyTimings.endToEndLatency + "</div>" : "";
		this.latencyTestResultsElement.innerHTML = latencyStatsInnerHTML;
	}

}