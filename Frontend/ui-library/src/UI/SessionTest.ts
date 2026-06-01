// Copyright Epic Games, Inc. All Rights Reserved.

import {
    AggregatedStats,
    LatencyInfo,
    Logger,
    SettingNumber
} from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.8';
import { SettingUINumber } from '../Config/SettingUINumber';

/**
 * Session test UI elements and results handling.
 * Creates a button to start the test and collects stats and latency info during the test.
 * After the test is finished, it generates CSV files for stats and latency info.
 * The test runs for a specified time frame, which can be set in the UI.
 */
export class SessionTest {
    _rootElement: HTMLElement;
    _latencyTestButton: HTMLInputElement;
    _testTimeFrameSetting: SettingNumber<'TestTimeFrame'>;

    isCollectingStats: boolean;

    records: AggregatedStats[];
    latencyRecords: LatencyInfo[];

    constructor() {
        this.isCollectingStats = false;
    }

    /**
     * Make the elements for the session test: e.g. button and test time input.
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
            headingText.innerHTML = 'Session Test';
            heading.appendChild(headingText);

            // make test results element
            const resultsParentElem = document.createElement('div');
            resultsParentElem.id = 'latencyTestContainer';
            resultsParentElem.classList.add('d-none');
            this._rootElement.appendChild(resultsParentElem);

            this._testTimeFrameSetting = new SettingNumber(
                'TestTimeFrame',
                'Test Time Frame',
                'How long the test runs for (seconds)',
                0 /*min*/,
                3600 /*max*/,
                60 /*default*/,
                false
            );
            const testTimeFrameSetting = new SettingUINumber(this._testTimeFrameSetting);
            resultsParentElem.appendChild(testTimeFrameSetting.rootElement);
            resultsParentElem.appendChild(this.latencyTestButton);
        }
        return this._rootElement;
    }

    public get latencyTestButton(): HTMLInputElement {
        if (!this._latencyTestButton) {
            this._latencyTestButton = document.createElement('input');
            this._latencyTestButton.type = 'button';
            this._latencyTestButton.value = 'Run Test';
            this._latencyTestButton.id = 'btn-start-latency-test';
            this._latencyTestButton.classList.add('streamTools-button');
            this._latencyTestButton.classList.add('btn-flat');

            this._latencyTestButton.onclick = () => {
                this.records = [];
                this.latencyRecords = [];
                this.isCollectingStats = true;
                this._latencyTestButton.disabled = true;
                this._latencyTestButton.value = 'Running...';
                Logger.Info(`Starting session test. Duration: [${this._testTimeFrameSetting.number}]`);
                setTimeout(() => {
                    this.onCollectingFinished();
                    this._latencyTestButton.disabled = false;
                    this._latencyTestButton.value = 'Run Test';
                }, this._testTimeFrameSetting.number * 1000);
            };
        }
        return this._latencyTestButton;
    }

    public handleStats(stats: AggregatedStats) {
        if (!this.isCollectingStats) {
            return;
        }

        const statsCopy = structuredClone(stats);
        this.records.push(statsCopy);
    }

    public handleLatencyInfo(latencyInfo: LatencyInfo) {
        if (!this.isCollectingStats) {
            return;
        }

        const latencyInfoCopy = structuredClone(latencyInfo);
        this.latencyRecords.push(latencyInfoCopy);
    }

    private onCollectingFinished() {
        this.isCollectingStats = false;
        Logger.Info(`Finished session test`);

        this.generateStatsCsv();
        this.generateLatencyCsv();
    }

    private generateStatsCsv() {
        const csvHeader: string[] = [];

        this.records.forEach((record: AggregatedStats) => {
            for (const i in record) {
                const obj: {} = record[i as never];

                if (Array.isArray(obj)) {
                    for (let j = 0; j < obj.length; j++) {
                        const arrayVal = obj[j];
                        for (const k in arrayVal) {
                            if (csvHeader.indexOf(`${i}.${j}.${k}`) === -1) {
                                csvHeader.push(`${i}.${j}.${k}`);
                            }
                        }
                    }
                } else if (obj instanceof Map) {
                    for (const j in obj.keys()) {
                        const mapVal = obj.get(j);
                        for (const k in mapVal) {
                            if (csvHeader.indexOf(`${i}.${j}.${k}`) === -1) {
                                csvHeader.push(`${i}.${j}.${k}`);
                            }
                        }
                    }
                } else {
                    for (const j in obj) {
                        if (csvHeader.indexOf(`${i}.${j}`) === -1) {
                            csvHeader.push(`${i}.${j}`);
                        }
                    }
                }
            }
        });

        let csvBody = '';
        this.records.forEach((record) => {
            csvHeader.forEach((field) => {
                try {
                    csvBody += `"${field.split('.').reduce((o, k) => o[k as never], record) as unknown as string}",`;
                } catch (_) {
                    csvBody += `"",`;
                }
            });
            csvBody += `\n`;
        });

        const file = new Blob([`${csvHeader.join(',')}\n${csvBody}`], { type: 'text/plain' });
        const a = document.createElement('a');
        const url = URL.createObjectURL(file);
        a.href = url;
        a.download = 'stats.csv';
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }

    private generateLatencyCsv() {
        const csvHeader: string[] = [];

        this.latencyRecords.forEach((record) => {
            for (const i in record) {
                const obj = record[i as never];

                if (typeof obj === 'object') {
                    for (const j in obj as object) {
                        if (csvHeader.indexOf(`${i}.${j}`) === -1) {
                            csvHeader.push(`${i}.${j}`);
                        }
                    }
                } else if (csvHeader.indexOf(`${i}`) === -1) {
                    csvHeader.push(`${i}`);
                }
            }
        });

        let csvBody = '';
        this.latencyRecords.forEach((record) => {
            csvHeader.forEach((field) => {
                try {
                    csvBody += `"${field.split('.').reduce((o, k) => o[k as never], record) as unknown as string}",`;
                } catch (_) {
                    csvBody += `"",`;
                }
            });
            csvBody += `\n`;
        });

        const file = new Blob([`${csvHeader.join(',')}\n${csvBody}`], { type: 'text/plain' });
        const a = document.createElement('a');
        const url = URL.createObjectURL(file);
        a.href = url;
        a.download = 'latency.csv';
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }
}
