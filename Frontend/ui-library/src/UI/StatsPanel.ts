// Copyright Epic Games, Inc. All Rights Reserved.

import { LatencyTest } from './LatencyTest';
import {
    CandidatePairStats,
    Config,
    LatencyInfo,
    Logger,
    PixelStreaming,
    PixelStreamingSettings,
    Flags
} from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.8';
import { AggregatedStats } from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.8';
import { MathUtils } from '../Util/MathUtils';
import { DataChannelLatencyTest } from './DataChannelLatencyTest';
import { SessionTest } from './SessionTest';
import {
    isSectionEnabled,
    StatsSections,
    StatsSectionsIds,
    StatsPanelConfiguration
} from './UIConfigurationTypes';

/**
 * A stat structure, an id, the stat string, and the element where it is rendered.
 */
export class Stat {
    id: string;
    title: string;
    stat: string;
    element: HTMLElement;
}

/**
 * A UI component containing all the stats for the application.
 */
export class StatsPanel {
    _rootElement: HTMLElement;
    _statsCloseButton: HTMLElement;
    _statsContentElement: HTMLElement;
    _statisticsContainer: HTMLElement;
    _latencyStatsContainer: HTMLElement;
    _statsResult: HTMLElement;
    _latencyResult: HTMLElement;
    _config: StatsPanelConfiguration;

    sessionTest: SessionTest | null = null;
    latencyTest: LatencyTest;
    dataChannelLatencyTest: DataChannelLatencyTest;

    /* A map stats we are storing/rendering */
    statsMap = new Map<string, Stat>();

    constructor(config: StatsPanelConfiguration, streamConfig: Config) {
        this._config = config;

        // Only create the session test class/ui-elements if the ?LatencyCSV flag is enabled.
        this.sessionTest = streamConfig.isFlagEnabled(Flags.LatencyCSV) ? new SessionTest() : null;
        this.latencyTest = new LatencyTest();
        this.dataChannelLatencyTest = new DataChannelLatencyTest();
    }

    /**
     * @returns Return or creates a HTML element that represents this setting in the DOM.
     */
    public get rootElement(): HTMLElement {
        if (!this._rootElement) {
            this._rootElement = document.createElement('div');
            this._rootElement.id = 'stats-panel';
            this._rootElement.classList.add('panel-wrap');

            const panelElem = document.createElement('div');
            panelElem.classList.add('panel');
            this._rootElement.appendChild(panelElem);

            const statsHeading = document.createElement('div');
            statsHeading.id = 'statsHeading';
            statsHeading.textContent = 'Information';
            panelElem.appendChild(statsHeading);

            panelElem.appendChild(this.statsCloseButton);
            panelElem.appendChild(this.statsContentElement);
        }
        return this._rootElement;
    }

    public get statsContentElement(): HTMLElement {
        if (!this._statsContentElement) {
            this._statsContentElement = document.createElement('div');
            this._statsContentElement.id = 'statsContent';

            const streamToolStats = document.createElement('div');
            streamToolStats.id = 'streamToolsStats';
            streamToolStats.classList.add('container');

            const controlStats = document.createElement('div');
            controlStats.id = 'ControlStats';
            controlStats.classList.add('row');

            const statistics = document.createElement('section');
            statistics.id = 'statistics';
            statistics.classList.add('settingsContainer');

            const latencyStats = document.createElement('section');
            latencyStats.id = 'latencyStats';
            latencyStats.classList.add('settingsContainer');

            const statisticsHeader = document.createElement('div');
            statisticsHeader.id = 'statisticsHeader';
            statisticsHeader.classList.add('settings-text');
            statisticsHeader.classList.add('settingsHeader');

            const latencyStatsHeader = document.createElement('div');
            latencyStatsHeader.id = 'latencyStatsHeader';
            latencyStatsHeader.classList.add('settings-text');
            latencyStatsHeader.classList.add('settingsHeader');

            this._statsContentElement.appendChild(streamToolStats);
            streamToolStats.appendChild(controlStats);

            // Add sesssion test to the UI if ?LatencyCSV flag is enabled and config allows it.
            if (this.sessionTest && isSectionEnabled(this._config, StatsSections.SessionTest)) {
                controlStats.appendChild(this.sessionTest.rootElement);
            }

            controlStats.appendChild(statistics);
            controlStats.appendChild(latencyStats);

            statistics.appendChild(statisticsHeader);
            latencyStats.appendChild(latencyStatsHeader);

            if (isSectionEnabled(this._config, StatsSections.SessionStats)) {
                const sessionStatsText = document.createElement('div');
                sessionStatsText.innerHTML = StatsSections.SessionStats;
                statisticsHeader.appendChild(sessionStatsText);
            }
            statistics.appendChild(this.statisticsContainer);

            if (isSectionEnabled(this._config, StatsSections.LatencyStats)) {
                const latencyStatsText = document.createElement('div');
                latencyStatsText.innerHTML = StatsSections.LatencyStats;
                latencyStatsHeader.appendChild(latencyStatsText);
            }
            latencyStats.appendChild(this.latencyStatsContainer);

            if (isSectionEnabled(this._config, StatsSections.LatencyTest)) {
                controlStats.appendChild(this.latencyTest.rootElement);
            }

            if (isSectionEnabled(this._config, StatsSections.DataChannelLatencyTest)) {
                controlStats.appendChild(this.dataChannelLatencyTest.rootElement);
            }
        }
        return this._statsContentElement;
    }

    public get statisticsContainer(): HTMLElement {
        if (!this._statisticsContainer) {
            this._statisticsContainer = document.createElement('div');
            this._statisticsContainer.id = 'statisticsContainer';
            this._statisticsContainer.classList.add('d-none');
            this._statisticsContainer.appendChild(this.statsResult);
        }
        return this._statisticsContainer;
    }

    public get latencyStatsContainer(): HTMLElement {
        if (!this._latencyStatsContainer) {
            this._latencyStatsContainer = document.createElement('div');
            this._latencyStatsContainer.id = 'latencyStatsContainer';
            this._latencyStatsContainer.classList.add('d-none');
            this._latencyStatsContainer.appendChild(this.latencyResult);
        }
        return this._latencyStatsContainer;
    }

    public get statsResult(): HTMLElement {
        if (!this._statsResult) {
            this._statsResult = document.createElement('div');
            this._statsResult.id = 'statisticsResult';
            this._statsResult.classList.add('StatsResult');
        }
        return this._statsResult;
    }

    public get latencyResult(): HTMLElement {
        if (!this._latencyResult) {
            this._latencyResult = document.createElement('div');
            this._latencyResult.id = 'latencyResult';
            this._latencyResult.classList.add('StatsResult');
        }
        return this._latencyResult;
    }

    public get statsCloseButton(): HTMLElement {
        if (!this._statsCloseButton) {
            this._statsCloseButton = document.createElement('div');
            this._statsCloseButton.id = 'statsClose';
        }
        return this._statsCloseButton;
    }

    public onDisconnect(): void {
        this.latencyTest.latencyTestButton.onclick = () => {
            // do nothing
        };
        this.dataChannelLatencyTest.latencyTestButton.onclick = () => {
            //do nothing
        };
    }

    public onVideoInitialized(stream: PixelStreaming): void {
        // starting a latency check
        this.latencyTest.latencyTestButton.onclick = () => {
            stream.requestLatencyTest();
        };
        this.dataChannelLatencyTest.latencyTestButton.onclick = () => {
            const started = stream.requestDataChannelLatencyTest({
                duration: 1000,
                rps: 10,
                requestSize: 200,
                responseSize: 200
            });
            if (started) {
                this.dataChannelLatencyTest.handleTestStart();
            }
        };
    }

    public configure(settings: PixelStreamingSettings): void {
        if (settings.DisableLatencyTest) {
            this.latencyTest.latencyTestButton.disabled = true;
            this.latencyTest.latencyTestButton.title = 'Disabled by -PixelStreamingDisableLatencyTester=true';
            this.dataChannelLatencyTest.latencyTestButton.disabled = true;
            this.dataChannelLatencyTest.latencyTestButton.title =
                'Disabled by -PixelStreamingDisableLatencyTester=true';
            Logger.Info(
                '-PixelStreamingDisableLatencyTester=true, requesting latency report from the the browser to UE is disabled.'
            );
        }
    }

    /**
     * Show stats panel.
     */
    public show(): void {
        if (!this.rootElement.classList.contains('panel-wrap-visible')) {
            this.rootElement.classList.add('panel-wrap-visible');
        }
    }

    /**
     * Toggle the visibility of the stats panel.
     */
    public toggleVisibility(): void {
        this.rootElement.classList.toggle('panel-wrap-visible');
    }

    /**
     * Hide the stats panel.
     */
    public hide(): void {
        if (this.rootElement.classList.contains('panel-wrap-visible')) {
            this.rootElement.classList.remove('panel-wrap-visible');
        }
    }

    public handlePlayerCount(playerCount: number) {
        this.addOrUpdateSessionStat('PlayerCountStat', 'Players', playerCount.toString());
    }

    /**
     * Handle stats coming in from browser/UE
     * @param stats - the stats structure
     */
    public handleStats(stats: AggregatedStats) {
        // format numbering based on the browser language
        const numberFormat = new Intl.NumberFormat(window.navigator.language, {
            maximumFractionDigits: 0
        });

        if (this.sessionTest) {
            this.sessionTest.handleStats(stats);
        }

        // Inbound data
        const inboundData = MathUtils.formatBytes(stats.inboundVideoStats.bytesReceived, 2);
        this.addOrUpdateSessionStat('InboundDataStat', 'Received', inboundData);

        // Packets lost
        const packetsLostStat = Object.prototype.hasOwnProperty.call(stats.inboundVideoStats, 'packetsLost')
            ? numberFormat.format(stats.inboundVideoStats.packetsLost)
            : 'Chrome only';
        this.addOrUpdateSessionStat('PacketsLostStat', 'Packets Lost', packetsLostStat);

        // Bitrate
        if (stats.inboundVideoStats.bitrate) {
            this.addOrUpdateSessionStat(
                'VideoBitrateStat',
                'Video Bitrate (kbps)',
                stats.inboundVideoStats.bitrate.toString()
            );
        }

        if (stats.inboundAudioStats.bitrate) {
            this.addOrUpdateSessionStat(
                'AudioBitrateStat',
                'Audio Bitrate (kbps)',
                stats.inboundAudioStats.bitrate.toString()
            );
        }

        // Video resolution
        const resStat =
            stats.inboundVideoStats.frameWidth !== undefined &&
            stats.inboundVideoStats.frameWidth > 0 &&
            stats.inboundVideoStats.frameHeight !== undefined &&
            stats.inboundVideoStats.frameHeight > 0
                ? stats.inboundVideoStats.frameWidth + 'x' + stats.inboundVideoStats.frameHeight
                : 'Chrome only';
        this.addOrUpdateSessionStat('VideoResStat', 'Video resolution', resStat);

        // Frames decoded
        if (stats.inboundVideoStats.framesDecoded !== undefined) {
            const framesDecoded = numberFormat.format(stats.inboundVideoStats.framesDecoded);
            this.addOrUpdateSessionStat('FramesDecodedStat', 'Frames Decoded', framesDecoded);
        }

        // Framerate
        if (stats.inboundVideoStats.framesPerSecond) {
            this.addOrUpdateSessionStat(
                'FramerateStat',
                'Framerate',
                stats.inboundVideoStats.framesPerSecond.toString()
            );
        }

        // Frames dropped
        if (stats.inboundVideoStats.framesDropped !== undefined) {
            this.addOrUpdateSessionStat(
                'FramesDroppedStat',
                'Frames dropped',
                stats.inboundVideoStats.framesDropped.toString()
            );
        }

        if (stats.inboundVideoStats.codecId) {
            this.addOrUpdateSessionStat(
                'VideoCodecStat',
                'Video codec',
                // Split the codec to remove the Fmtp line
                stats.codecs.get(stats.inboundVideoStats.codecId)?.mimeType.replace('video/', '') ?? ''
            );
        }

        if (stats.inboundAudioStats.codecId) {
            this.addOrUpdateSessionStat(
                'AudioCodecStat',
                'Audio codec',
                // Split the codec to remove the Fmtp line
                stats.codecs.get(stats.inboundAudioStats.codecId)?.mimeType.replace('audio/', '') ?? ''
            );
        }

        // Store the active candidate pair return a new Candidate pair stat if getActiveCandidate is null
        const activeCandidatePair: CandidatePairStats | null = stats.getActiveCandidatePair();

        if (activeCandidatePair) {
            // RTT
            const netRTT =
                Object.prototype.hasOwnProperty.call(activeCandidatePair, 'currentRoundTripTime') &&
                stats.isNumber(activeCandidatePair.currentRoundTripTime)
                    ? Math.ceil(activeCandidatePair.currentRoundTripTime * 1000).toString()
                    : "Can't calculate";
            this.addOrUpdateSessionStat('RTTStat', 'Net RTT (ms)', netRTT);
        }

        this.addOrUpdateSessionStat('DurationStat', 'Duration', stats.sessionStats.runTime);

        this.addOrUpdateSessionStat(
            'ControlsInputStat',
            'Controls stream input',
            stats.sessionStats.controlsStreamInput
        );

        // QP
        if (
            stats.sessionStats.videoEncoderAvgQP !== undefined &&
            !Number.isNaN(stats.sessionStats.videoEncoderAvgQP)
        ) {
            this.addOrUpdateSessionStat(
                'QPStat',
                'Video quantization parameter',
                stats.sessionStats.videoEncoderAvgQP.toString()
            );
        }

        Logger.Info(`--------- Stats ---------\n ${JSON.stringify(stats)}\n------------------------`);
    }

    public handleLatencyInfo(latencyInfo: LatencyInfo) {
        if (this.sessionTest) {
            this.sessionTest.handleLatencyInfo(latencyInfo);
        }

        if (latencyInfo.frameTiming !== undefined) {
            // Encoder latency
            if (latencyInfo.frameTiming.encoderLatencyMs !== undefined) {
                this.addOrUpdateLatencyStat(
                    'EncodeLatency',
                    'Encode latency (ms)',
                    Math.ceil(latencyInfo.frameTiming.encoderLatencyMs).toString()
                );
            }

            // Packetizer latency
            if (latencyInfo.frameTiming.packetizeLatencyMs !== undefined) {
                this.addOrUpdateLatencyStat(
                    'PacketizerLatency',
                    'Packetizer latency (ms)',
                    Math.ceil(latencyInfo.frameTiming.packetizeLatencyMs).toString()
                );
            }

            // Pacer latency
            if (latencyInfo.frameTiming.pacerLatencyMs !== undefined) {
                this.addOrUpdateLatencyStat(
                    'PacerLatency',
                    'Pacer latency (ms)',
                    Math.ceil(latencyInfo.frameTiming.pacerLatencyMs).toString()
                );
            }

            // Sender latency calculated using timing stats
            if (latencyInfo.frameTiming.captureToSendLatencyMs !== undefined) {
                this.addOrUpdateLatencyStat(
                    'VideoTimingCaptureToSend',
                    'Post-capture to send latency (ms)',
                    Math.ceil(latencyInfo.frameTiming.captureToSendLatencyMs).toString()
                );
            }
        }

        if (latencyInfo.senderLatencyMs !== undefined) {
            this.addOrUpdateLatencyStat(
                'AbsCaptureTimeToSendLatency',
                'Post-capture (abs-ct) to send latency (ms)',
                Math.ceil(latencyInfo.senderLatencyMs).toString()
            );
        }

        if (latencyInfo.averageAssemblyDelayMs !== undefined) {
            this.addOrUpdateLatencyStat(
                'AvgAssemblyDelay',
                'Assembly delay (ms)',
                Math.ceil(latencyInfo.averageAssemblyDelayMs).toString()
            );
        }

        if (latencyInfo.averageDecodeLatencyMs !== undefined) {
            this.addOrUpdateLatencyStat(
                'AvgDecodeDelay',
                'Decode time (ms)',
                Math.ceil(latencyInfo.averageDecodeLatencyMs).toString()
            );
        }

        if (latencyInfo.averageJitterBufferDelayMs !== undefined) {
            this.addOrUpdateLatencyStat(
                'AvgJitterBufferDelay',
                'Jitter buffer (ms)',
                Math.ceil(latencyInfo.averageJitterBufferDelayMs).toString()
            );
        }

        if (latencyInfo.averageProcessingDelayMs !== undefined) {
            this.addOrUpdateLatencyStat(
                'AvgProcessingDelay',
                'Processing delay (ms)',
                Math.ceil(latencyInfo.averageProcessingDelayMs).toString()
            );
        }

        if (latencyInfo.averageE2ELatency !== undefined) {
            this.addOrUpdateLatencyStat(
                'AvgE2ELatency',
                'Total latency (ms)',
                Math.ceil(latencyInfo.averageE2ELatency).toString()
            );
        }
    }

    /**
     * Adds a new stat to the stats results in the DOM or updates an exiting stat.
     * @param id - The id of the stat to add/update.
     * @param stat - The contents of the stat.
     */
    public addOrUpdateSessionStat(id: string, statLabel: string, stat: string) {
        this.addOrUpdateStat(StatsSections.SessionStats, id, statLabel, stat);
    }

    /**
     * Adds a new stat to the latency results in the DOM or updates an exiting stat.
     * @param id - The id of the stat to add/update.
     * @param stat - The contents of the stat.
     */
    public addOrUpdateLatencyStat(id: string, statLabel: string, stat: string) {
        this.addOrUpdateStat(StatsSections.LatencyStats, id, statLabel, stat);
    }

    /**
     * Adds a new stat to the stats results in the DOM or updates an exiting stat.
     * @param sectionId - The section to add this stat too.
     * @param id - The id of the stat to add/update.
     * @param stat - The contents of the stat.
     */
    private addOrUpdateStat(sectionId: StatsSectionsIds, id: string, statLabel: string, stat: string) {
        if (
            sectionId === StatsSections.SessionStats &&
            !isSectionEnabled(this._config, StatsSections.SessionStats)
        ) {
            return;
        }

        if (
            sectionId === StatsSections.LatencyStats &&
            !isSectionEnabled(this._config, StatsSections.LatencyStats)
        ) {
            return;
        }

        // Only support session or latency stats being updated in this function currently
        if (sectionId !== StatsSections.SessionStats && sectionId !== StatsSections.LatencyStats) {
            return;
        }

        const parentElem: HTMLElement =
            sectionId === StatsSections.SessionStats ? this.statsResult : this.latencyResult;
        const statHTML = `${statLabel}: ${stat}`;

        if (!this.statsMap.has(id)) {
            // create the stat
            const newStat = new Stat();
            newStat.id = id;
            newStat.stat = stat;
            newStat.title = statLabel;
            newStat.element = document.createElement('div');
            newStat.element.innerHTML = statHTML;
            // add the stat to the dom
            parentElem.appendChild(newStat.element);
            this.statsMap.set(id, newStat);
        }
        // update the existing stat
        else {
            const value = this.statsMap.get(id);
            if (value !== undefined) {
                value.element.innerHTML = statHTML;
            }
        }
    }
}
