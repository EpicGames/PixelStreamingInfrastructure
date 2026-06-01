// Copyright Epic Games, Inc. All Rights Reserved.

import { LatencyTestResults } from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.8';
import { Logger } from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.8';
import { StatsSections } from './UIConfigurationTypes';

/**
 * Latency test UI elements and results handling.
 */
export class LatencyTest {
    _rootElement: HTMLElement;
    _latencyTestButton: HTMLInputElement;
    _latencyTestResultsElement: HTMLElement;

    /**
     * Get the the button containing the stats icon.
     */
    public get rootElement(): HTMLElement {
        if (!this._rootElement) {
            this._rootElement = document.createElement('section');
            this._rootElement.classList.add('settingsContainer');

            // make heading
            const heading = document.createElement('div');
            heading.id = 'latencyTestHeader';
            heading.classList.add('settings-text');
            heading.classList.add('settingsHeader');
            this._rootElement.appendChild(heading);

            const headingText = document.createElement('div');
            headingText.innerHTML = StatsSections.LatencyTest;
            heading.appendChild(headingText);
            heading.appendChild(this.latencyTestButton);

            // make test results element
            const resultsParentElem = document.createElement('div');
            resultsParentElem.id = 'latencyTestContainer';
            resultsParentElem.classList.add('d-none');
            this._rootElement.appendChild(resultsParentElem);

            resultsParentElem.appendChild(this.latencyTestResultsElement);
        }
        return this._rootElement;
    }

    public get latencyTestResultsElement(): HTMLElement {
        if (!this._latencyTestResultsElement) {
            this._latencyTestResultsElement = document.createElement('div');
            this._latencyTestResultsElement.id = 'latencyStatsResults';
            this._latencyTestResultsElement.classList.add('StatsResult');
        }
        return this._latencyTestResultsElement;
    }

    public get latencyTestButton(): HTMLInputElement {
        if (!this._latencyTestButton) {
            this._latencyTestButton = document.createElement('input');
            this._latencyTestButton.type = 'button';
            this._latencyTestButton.value = 'Run Test';
            this._latencyTestButton.id = 'btn-start-latency-test';
            this._latencyTestButton.classList.add('streamTools-button');
            this._latencyTestButton.classList.add('btn-flat');
        }
        return this._latencyTestButton;
    }

    /**
     * Populate the UI based on the latency test's results.
     * @param latencyTimings - The latency test results.
     */
    public handleTestResult(latencyTimings: LatencyTestResults) {
        Logger.Info(JSON.stringify(latencyTimings));
        let latencyStatsInnerHTML = '';

        if (latencyTimings.networkLatency !== undefined && latencyTimings.networkLatency > 0) {
            latencyStatsInnerHTML += '<div>Net latency RTT (ms): ' + latencyTimings.networkLatency + '</div>';
        }

        if (latencyTimings.EncodeMs !== undefined && latencyTimings.EncodeMs > 0) {
            latencyStatsInnerHTML += '<div>UE Encode (ms): ' + latencyTimings.EncodeMs + '</div>';
        }

        if (latencyTimings.CaptureToSendMs !== undefined && latencyTimings.CaptureToSendMs > 0) {
            latencyStatsInnerHTML += '<div>UE Capture (ms): ' + latencyTimings.CaptureToSendMs + '</div>';
        }

        if (latencyTimings.browserSendLatency !== undefined && latencyTimings.browserSendLatency > 0) {
            latencyStatsInnerHTML +=
                '<div>Browser send latency (ms): ' + latencyTimings.browserSendLatency + '</div>';
        }

        if (
            latencyTimings.frameDisplayDeltaTimeMs !== undefined &&
            latencyTimings.browserReceiptTimeMs !== undefined
        ) {
            latencyStatsInnerHTML +=
                latencyTimings.frameDisplayDeltaTimeMs && latencyTimings.browserReceiptTimeMs
                    ? '<div>Browser receive latency (ms): ' +
                      latencyTimings.frameDisplayDeltaTimeMs +
                      '</div>'
                    : '';
        }

        if (latencyTimings.latencyExcludingDecode !== undefined) {
            latencyStatsInnerHTML +=
                '<div>Total latency (excluding browser) (ms): ' +
                latencyTimings.latencyExcludingDecode +
                '</div>';
        }

        if (latencyTimings.endToEndLatency !== undefined) {
            latencyStatsInnerHTML += latencyTimings.endToEndLatency
                ? '<div>Total latency (ms): ' + latencyTimings.endToEndLatency + '</div>'
                : '';
        }

        this.latencyTestResultsElement.innerHTML = latencyStatsInnerHTML;
    }
}
