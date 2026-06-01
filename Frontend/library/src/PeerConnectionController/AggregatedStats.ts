// Copyright Epic Games, Inc. All Rights Reserved.

import { InboundRTPStats, InboundVideoStats, InboundAudioStats } from './InboundRTPStats';
import { InboundTrackStats } from './InboundTrackStats';
import { DataChannelStats } from './DataChannelStats';
import { CandidateStat } from './CandidateStat';
import { CandidatePairStats } from './CandidatePairStats';
import { RemoteOutboundRTPStats, OutboundRTPStats } from './OutBoundRTPStats';
import { SessionStats } from './SessionStats';
import { StreamStats } from './StreamStats';
import { CodecStats } from './CodecStats';
import { Logger } from '@epicgames-ps/lib-pixelstreamingcommon-ue5.8';

/**
 * The Aggregated Stats that is generated from the RTC Stats Report
 */

export class AggregatedStats {
    inboundVideoStats: InboundVideoStats;
    inboundAudioStats: InboundAudioStats;
    candidatePairs: Array<CandidatePairStats>;
    datachannelStats: DataChannelStats;
    localCandidates: Array<CandidateStat>;
    remoteCandidates: Array<CandidateStat>;
    outboundVideoStats: OutboundRTPStats;
    outboundAudioStats: OutboundRTPStats;
    remoteOutboundVideoStats: RemoteOutboundRTPStats;
    remoteOutboundAudioStats: RemoteOutboundRTPStats;
    sessionStats: SessionStats;
    streamStats: StreamStats;
    codecs: Map<string, CodecStats>;
    transportStats: RTCTransportStats;

    constructor() {
        this.inboundVideoStats = new InboundVideoStats();
        this.inboundAudioStats = new InboundAudioStats();
        this.candidatePairs = new Array<CandidatePairStats>();
        this.datachannelStats = new DataChannelStats();
        this.localCandidates = new Array<CandidateStat>();
        this.remoteCandidates = new Array<CandidateStat>();
        this.outboundVideoStats = new OutboundRTPStats();
        this.outboundAudioStats = new OutboundRTPStats();
        this.remoteOutboundAudioStats = new RemoteOutboundRTPStats();
        this.remoteOutboundVideoStats = new RemoteOutboundRTPStats();
        this.sessionStats = new SessionStats();
        this.streamStats = new StreamStats();
        this.codecs = new Map<string, CodecStats>();
    }

    /**
     * Gather all the information from the RTC Peer Connection Report
     * @param rtcStatsReport - RTC Stats Report
     */
    processStats(rtcStatsReport: RTCStatsReport) {
        this.localCandidates = new Array<CandidateStat>();
        this.remoteCandidates = new Array<CandidateStat>();
        this.candidatePairs = new Array<CandidatePairStats>();

        rtcStatsReport.forEach((stat) => {
            const type: string = stat.type;

            switch (type) {
                case 'candidate-pair':
                    this.handleCandidatePair(stat);
                    break;
                case 'certificate':
                    break;
                case 'codec':
                    this.handleCodec(stat);
                    break;
                case 'data-channel':
                    this.handleDataChannel(stat);
                    break;
                case 'inbound-rtp':
                    this.handleInboundRTP(stat);
                    break;
                case 'local-candidate':
                    this.handleLocalCandidate(stat);
                    break;
                case 'media-source':
                    break;
                case 'media-playout':
                    break;
                case 'outbound-rtp':
                    this.handleLocalOutbound(stat);
                    break;
                case 'peer-connection':
                    break;
                case 'remote-candidate':
                    this.handleRemoteCandidate(stat);
                    break;
                case 'remote-inbound-rtp':
                    break;
                case 'remote-outbound-rtp':
                    this.handleRemoteOutbound(stat);
                    break;
                case 'track':
                    this.handleTrack(stat);
                    break;
                case 'transport':
                    this.handleTransport(stat);
                    break;
                case 'stream':
                    this.handleStream(stat);
                    break;
                default:
                    Logger.Error('unhandled Stat Type');
                    Logger.Info(stat);
                    break;
            }
        });
    }

    /**
     * Process stream stats data from webrtc
     *
     * @param stat - the stats coming in from webrtc
     */
    handleStream(stat: StreamStats) {
        this.streamStats = stat;
    }

    /**
     * Process the Ice Candidate Pair Data
     * @param stat - the stats coming in from ice candidates
     */
    handleCandidatePair(stat: CandidatePairStats) {
        // Add the candidate pair to the candidate pair array
        this.candidatePairs.push(stat);
    }

    /**
     * Process the Data Channel Data
     * @param stat - the stats coming in from the data channel
     */
    handleDataChannel(stat: DataChannelStats) {
        this.datachannelStats.bytesReceived = stat.bytesReceived;
        this.datachannelStats.bytesSent = stat.bytesSent;
        this.datachannelStats.dataChannelIdentifier = stat.dataChannelIdentifier;
        this.datachannelStats.id = stat.id;
        this.datachannelStats.label = stat.label;
        this.datachannelStats.messagesReceived = stat.messagesReceived;
        this.datachannelStats.messagesSent = stat.messagesSent;
        this.datachannelStats.protocol = stat.protocol;
        this.datachannelStats.state = stat.state;
        this.datachannelStats.timestamp = stat.timestamp;
    }

    /**
     * Process the Local Ice Candidate Data
     * @param stat - local stats
     */
    handleLocalCandidate(stat: CandidateStat) {
        const localCandidate = new CandidateStat();
        localCandidate.label = 'local-candidate';
        localCandidate.address = stat.address;
        localCandidate.port = stat.port;
        localCandidate.protocol = stat.protocol;
        localCandidate.candidateType = stat.candidateType;
        localCandidate.id = stat.id;
        localCandidate.relayProtocol = stat.relayProtocol;
        localCandidate.transportId = stat.transportId;
        this.localCandidates.push(localCandidate);
    }

    /**
     * Process the Remote Ice Candidate Data
     * @param stat - ice candidate stats
     */
    handleRemoteCandidate(stat: CandidateStat) {
        const remoteCandidate = new CandidateStat();
        remoteCandidate.label = 'remote-candidate';
        remoteCandidate.address = stat.address;
        remoteCandidate.port = stat.port;
        remoteCandidate.protocol = stat.protocol;
        remoteCandidate.id = stat.id;
        remoteCandidate.candidateType = stat.candidateType;
        remoteCandidate.relayProtocol = stat.relayProtocol;
        remoteCandidate.transportId = stat.transportId;
        this.remoteCandidates.push(remoteCandidate);
    }

    /**
     * Process the Inbound RTP Audio and Video Data
     * @param stat - inbound rtp stats
     */
    handleInboundRTP(stat: InboundRTPStats) {
        switch (stat.kind) {
            case 'video':
                // Calculate bitrate between stat updates
                if (
                    stat.bytesReceived > this.inboundVideoStats.bytesReceived &&
                    stat.timestamp > this.inboundVideoStats.timestamp
                ) {
                    this.inboundVideoStats.bitrate =
                        (8 * (stat.bytesReceived - this.inboundVideoStats.bytesReceived)) /
                        (stat.timestamp - this.inboundVideoStats.timestamp);
                    this.inboundVideoStats.bitrate = Math.floor(this.inboundVideoStats.bitrate);
                }

                // Copy members from stat into `this.inboundVideoStats`
                for (const key in stat) {
                    (this.inboundVideoStats as any)[key] = (stat as any)[key];
                }
                break;
            case 'audio':
                if (
                    stat.bytesReceived > this.inboundAudioStats.bytesReceived &&
                    stat.timestamp > this.inboundAudioStats.timestamp
                ) {
                    this.inboundAudioStats.bitrate =
                        (8 * (stat.bytesReceived - this.inboundAudioStats.bytesReceived)) /
                        (stat.timestamp - this.inboundAudioStats.timestamp);
                    this.inboundAudioStats.bitrate = Math.floor(this.inboundAudioStats.bitrate);
                }
                // Copy members from stat into `this.inboundAudioStats`
                for (const key in stat) {
                    (this.inboundAudioStats as any)[key] = (stat as any)[key];
                }
                break;
            default:
                Logger.Error(`Kind should be audio or video, we got ${stat.kind} - that's unsupported.`);
                break;
        }
    }

    /**
     * Process the "local" outbound RTP Audio and Video stats.
     * @param stat - local outbound rtp stats
     */
    handleLocalOutbound(stat: OutboundRTPStats) {
        const localOutboundStats: OutboundRTPStats =
            stat.kind === 'audio' ? this.outboundAudioStats : this.outboundVideoStats;
        localOutboundStats.active = stat.active;
        localOutboundStats.codecId = stat.codecId;
        localOutboundStats.bytesSent = stat.bytesSent;
        localOutboundStats.frameHeight = stat.frameHeight;
        localOutboundStats.frameWidth = stat.frameWidth;
        localOutboundStats.framesEncoded = stat.framesEncoded;
        localOutboundStats.framesPerSecond = stat.framesPerSecond;
        localOutboundStats.headerBytesSent = stat.headerBytesSent;
        localOutboundStats.id = stat.id;
        localOutboundStats.keyFramesEncoded = stat.keyFramesEncoded;
        localOutboundStats.kind = stat.kind;
        localOutboundStats.mediaSourceId = stat.mediaSourceId;
        localOutboundStats.mid = stat.mid;
        localOutboundStats.nackCount = stat.nackCount;
        localOutboundStats.packetsSent = stat.packetsSent;
        localOutboundStats.qpSum = stat.qpSum;
        localOutboundStats.qualityLimitationDurations = stat.qualityLimitationDurations;
        localOutboundStats.qualityLimitationReason = stat.qualityLimitationReason;
        localOutboundStats.remoteId = stat.remoteId;
        localOutboundStats.retransmittedBytesSent = stat.retransmittedBytesSent;
        localOutboundStats.rid = stat.rid;
        localOutboundStats.scalabilityMode = stat.scalabilityMode;
        localOutboundStats.ssrc = stat.ssrc;
        localOutboundStats.targetBitrate = stat.targetBitrate;
        localOutboundStats.timestamp = stat.timestamp;
        localOutboundStats.totalEncodeTime = stat.totalEncodeTime;
        localOutboundStats.totalEncodeBytesTarget = stat.totalEncodeBytesTarget;
        localOutboundStats.totalPacketSendDelay = stat.totalPacketSendDelay;
        localOutboundStats.transportId = stat.transportId;
    }

    /**
     * Process the "remote" outbound RTP Audio and Video stats.
     * @param stat - remote outbound rtp stats
     */
    handleRemoteOutbound(stat: RemoteOutboundRTPStats) {
        const remoteOutboundStats: RemoteOutboundRTPStats =
            stat.kind === 'audio' ? this.remoteOutboundAudioStats : this.remoteOutboundVideoStats;
        remoteOutboundStats.bytesSent = stat.bytesSent;
        remoteOutboundStats.codecId = stat.codecId;
        remoteOutboundStats.id = stat.id;
        remoteOutboundStats.kind = stat.kind;
        remoteOutboundStats.localId = stat.localId;
        remoteOutboundStats.packetsSent = stat.packetsSent;
        remoteOutboundStats.remoteTimestamp = stat.remoteTimestamp;
        remoteOutboundStats.reportsSent = stat.reportsSent;
        remoteOutboundStats.roundTripTimeMeasurements = stat.roundTripTimeMeasurements;
        remoteOutboundStats.ssrc = stat.ssrc;
        remoteOutboundStats.timestamp = stat.timestamp;
        remoteOutboundStats.totalRoundTripTime = stat.totalRoundTripTime;
        remoteOutboundStats.transportId = stat.transportId;
    }

    /**
     * Process the Inbound Video Track Data
     * @param stat - video track stats
     */
    handleTrack(stat: InboundTrackStats) {
        // we only want to extract stats from the video track
        if (stat.type === 'track' && (stat.trackIdentifier === 'video_label' || stat.kind === 'video')) {
            this.inboundVideoStats.framesDropped = stat.framesDropped;
            this.inboundVideoStats.framesReceived = stat.framesReceived;
            this.inboundVideoStats.frameHeight = stat.frameHeight;
            this.inboundVideoStats.frameWidth = stat.frameWidth;
        }
    }

    handleTransport(stat: RTCTransportStats) {
        this.transportStats = stat;
    }

    handleCodec(stat: CodecStats) {
        const codecId = stat.id;
        this.codecs.set(codecId, stat);
    }

    handleSessionStatistics(
        videoStartTime: number,
        inputController: boolean | null,
        videoEncoderAvgQP: number
    ) {
        const deltaTime = Date.now() - videoStartTime;
        this.sessionStats.runTime = new Date(deltaTime).toISOString().substr(11, 8).toString();

        const controlsStreamInput =
            inputController === null ? 'Not sent yet' : inputController ? 'true' : 'false';
        this.sessionStats.controlsStreamInput = controlsStreamInput;

        this.sessionStats.videoEncoderAvgQP = videoEncoderAvgQP;
    }

    /**
     * Check if a value coming in from our stats is actually a number
     * @param value - the number to be checked
     */
    isNumber(value: unknown): boolean {
        return typeof value === 'number' && isFinite(value);
    }

    /**
     * Helper function to return the active candidate pair
     * @returns The candidate pair that is currently receiving data
     */
    public getActiveCandidatePair(): CandidatePairStats | null {
        if (this.candidatePairs === undefined) {
            return null;
        }

        // Check if the RTCTransport stat is not undefined
        if (this.transportStats) {
            // Return the candidate pair that matches the transport candidate pair id
            const selectedPair: CandidatePairStats | undefined = this.candidatePairs.find(
                (candidatePair) => candidatePair.id === this.transportStats.selectedCandidatePairId
            );
            if (selectedPair === undefined) {
                return null;
            } else {
                return selectedPair;
            }
        }

        // Fall back to the `.selected` member of the candidate pair
        const selectedPair: CandidatePairStats | undefined = this.candidatePairs.find(
            (candidatePair) => candidatePair.selected
        );
        if (selectedPair === undefined) {
            return null;
        } else {
            return selectedPair;
        }
    }
}
