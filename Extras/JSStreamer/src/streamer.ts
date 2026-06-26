// Copyright Epic Games, Inc. All Rights Reserved.
import {
    ITransport,
    WebSocketTransport,
    SignallingProtocol,
    Messages,
    MessageHelpers,
    BaseMessage,
    EventEmitter,
    SDPUtils
} from '@epicgames-ps/lib-pixelstreamingcommon-ue5.8';
import { DataProtocol } from './protocol';

interface PixelStreamingSettings {
    AllowPixelStreamingCommands: boolean;
    DisableLatencyTest: boolean;
}

interface EncoderSettings {
    TargetBitrate: number;
    MaxBitrate: number;
    MinQP: number;
    MaxQP: number;
    RateControl: 'ConstQP' | 'VBR' | 'CBR';
    FillerData: number;
    MultiPass: 'DISABLED' | 'QUARTER' | 'FULL';
}

interface WebRTCSettings {
    DegradationPref: 'MAINTAIN_FRAMERATE' | 'MAINTAIN_RESOLUTION';
    FPS: number;
    MinBitrate: number;
    MaxBitrate: number;
    LowQP: number;
    HighQP: number;
    AbsCaptureTimeHeaderExt: boolean;
}

interface Settings {
    PixelStreaming: PixelStreamingSettings;
    Encoder: EncoderSettings;
    WebRTC: WebRTCSettings;
    ConfigOptions: object;
}

export class PlayerPeer {
    id: string;
    peerConnection: RTCPeerConnection;
    dataChannel: RTCDataChannel;
    statsTimer?: any;

    lastQpSum?: number;
    lastStatsTime?: number;
}

const protocolVersion = '1.0.0';

export class Streamer extends EventEmitter {
    id: string;
    settings: Settings;
    protocol: SignallingProtocol;
    transport: ITransport;
    playerMap: Map<string, PlayerPeer>;
    localStream: MediaStream;
    peerConnectionOptions: Messages.peerConnectionOptions;

    constructor(streamerId: string) {
        super();
        this.id = streamerId;
        this.playerMap = new Map<string, PlayerPeer>();
        this.transport = new WebSocketTransport();
        this.protocol = new SignallingProtocol(this.transport);

        // just some default settings. (most of these wont make a difference but the frontend expects them)
        this.settings = {
            PixelStreaming: {
                AllowPixelStreamingCommands: false,
                DisableLatencyTest: false
            },
            Encoder: {
                TargetBitrate: -1,
                MaxBitrate: 20000000,
                MinQP: 0,
                MaxQP: 51,
                RateControl: 'CBR',
                FillerData: 0,
                MultiPass: 'FULL'
            },
            WebRTC: {
                DegradationPref: 'MAINTAIN_FRAMERATE',
                FPS: 60,
                MinBitrate: 100000,
                MaxBitrate: 100000000,
                LowQP: 25,
                HighQP: 37,
                AbsCaptureTimeHeaderExt: true
            },
            ConfigOptions: {}
        };

        this.protocol.addListener(Messages.config.typeName, (msg: BaseMessage) =>
            this.handleConfigMessage(msg as Messages.config)
        );

        this.protocol.addListener(Messages.identify.typeName, (msg: BaseMessage) =>
            this.handleIdentifyMessage(msg as Messages.identify)
        );

        this.protocol.addListener(Messages.endpointIdConfirm.typeName, (msg: BaseMessage) =>
            this.handleEndpointIdConfirmMessage(msg as Messages.endpointIdConfirm)
        );

        this.protocol.addListener(Messages.playerConnected.typeName, (msg: BaseMessage) =>
            this.handlePlayerConnectedMessage(msg as Messages.playerConnected)
        );

        this.protocol.addListener(Messages.playerDisconnected.typeName, (msg: BaseMessage) =>
            this.handlePlayerDisconnectedMessage(msg as Messages.playerDisconnected)
        );

        this.protocol.addListener(Messages.answer.typeName, (msg: BaseMessage) =>
            this.handleAnswerMessage(msg as Messages.answer)
        );

        this.protocol.addListener(Messages.iceCandidate.typeName, (msg: BaseMessage) =>
            this.handleIceMessage(msg as Messages.iceCandidate)
        );

        this.transport.on('timeout', () => console.log('Streamer connection timeout'));
    }

    startStreaming(signallingURL: string, stream: MediaStream) {
        this.localStream = stream;
        this.transport.connect(signallingURL);
    }

    stopStreaming() {
        this.transport.disconnect(1000, 'Normal shutdown by calling stopStreaming');
        for (const peer of this.playerMap.values()) {
            peer.peerConnection.close();
        }
    }

    handleConfigMessage(msg: Messages.config) {
        if (msg.peerConnectionOptions !== undefined) {
            this.peerConnectionOptions = msg.peerConnectionOptions;
        }
    }

    handleIdentifyMessage(_msg: Messages.identify) {
        const endpointMessage = MessageHelpers.createMessage(Messages.endpointId, {
            id: this.id,
            protocolVersion: protocolVersion
        });
        this.protocol.sendMessage(endpointMessage);
    }

    handleEndpointIdConfirmMessage(msg: Messages.endpointIdConfirm) {
        this.id = msg.committedId;
        this.emit('endpoint_id_confirmed');
    }

    handlePlayerConnectedMessage(msg: Messages.playerConnected) {
        if (this.localStream) {
            const playerId = msg.playerId;
            const peerConnection = new RTCPeerConnection(this.peerConnectionOptions);

            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    this.protocol.sendMessage(
                        MessageHelpers.createMessage(Messages.iceCandidate, {
                            playerId: playerId,
                            candidate: event.candidate
                        })
                    );
                }
            };

            this.localStream.getTracks().forEach((track: MediaStreamTrack) => {
                if (track.kind == 'video') {
                    if (this.settings.WebRTC.DegradationPref == 'MAINTAIN_FRAMERATE') {
                        track.contentHint = 'motion';
                    } else if (this.settings.WebRTC.DegradationPref == 'MAINTAIN_RESOLUTION') {
                        track.contentHint = 'detail';
                    }
                    const tranceiverOptions: RTCRtpTransceiverInit = {
                        streams: [this.localStream],
                        direction: 'sendrecv',
                        sendEncodings: [
                            {
                                maxBitrate: this.settings.WebRTC.MaxBitrate,
                                maxFramerate: this.settings.WebRTC.FPS,
                                priority: 'high',
                                rid: 'base'
                            }
                        ]
                    };
                    peerConnection.addTransceiver(track, tranceiverOptions);
                } else {
                    peerConnection.addTrack(track, this.localStream);
                }
            });

            const dataChannel = peerConnection.createDataChannel('datachannel', {
                ordered: true,
                negotiated: false
            });
            dataChannel.binaryType = 'arraybuffer';
            dataChannel.onopen = () => {
                this.sendDataProtocol(playerId);
                this.sendInitialSettings(playerId);
                this.emit('data_channel_opened', playerId);
            };
            dataChannel.onclose = () => {
                this.emit('data_channel_closed', playerId);
            };
            dataChannel.onmessage = (e: MessageEvent) => {
                const message = new Uint8Array(e.data as ArrayBuffer);
                this.handleDataChannelMessage(playerId, message);
            };

            const newPlayer: PlayerPeer = {
                id: playerId,
                peerConnection: peerConnection,
                dataChannel: dataChannel
            };

            const offerOptions: RTCOfferOptions = { offerToReceiveAudio: true, offerToReceiveVideo: true };

            peerConnection
                .createOffer(offerOptions)
                .then((offer) => {
                    if (offer.sdp == undefined) {
                        return;
                    }

                    // Munge offer
                    offer.sdp = this.mungeOffer(offer.sdp);

                    peerConnection
                        .setLocalDescription(offer)
                        .then(() => {
                            this.protocol.sendMessage(
                                MessageHelpers.createMessage(Messages.offer, {
                                    playerId: msg.playerId,
                                    sdp: offer.sdp
                                })
                            );
                            this.emit('local_description_set', offer);
                        })
                        .catch(() => {});
                })
                .catch(() => {});

            // report qp stat over time
            newPlayer.statsTimer = setInterval(() => {
                peerConnection
                    .getStats()
                    .then((stats: RTCStatsReport) => {
                        let qpSum: number | undefined = undefined;
                        let fps: number | undefined = undefined;
                        stats.forEach((report) => {
                            /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
                            if (report.type == 'outbound-rtp' && report.mediaType == 'video') {
                                qpSum = report.qpSum;
                                fps = report.framesPerSecond;
                            }
                            /* eslint-enable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
                        });
                        const nowTime = Date.now();
                        if (
                            newPlayer.lastStatsTime != undefined &&
                            newPlayer.lastQpSum !== undefined &&
                            qpSum !== undefined &&
                            fps !== undefined
                        ) {
                            const deltaMillis = nowTime - newPlayer.lastStatsTime;
                            const qpDelta = (qpSum - newPlayer.lastQpSum) * (deltaMillis / 1000);
                            const qpAvg = qpDelta / fps;

                            newPlayer.dataChannel.send(
                                this.constructMessage(DataProtocol.FromStreamer.VideoEncoderAvgQP, qpAvg)
                            );
                        }
                        newPlayer.lastQpSum = qpSum;
                        newPlayer.lastStatsTime = nowTime;
                    })
                    .catch(() => {});
            }, 1000);

            this.playerMap[playerId] = newPlayer;
            this.emit('player_connected', newPlayer);
        }
    }

    handlePlayerDisconnectedMessage(msg: Messages.playerDisconnected) {
        const playerId = msg.playerId;
        const playerPeer = this.playerMap[playerId];
        if (playerPeer && playerPeer.statsTimer) {
            clearInterval(playerPeer.statsTimer);
        }
        delete this.playerMap[playerId];
        this.emit('player_disconnected', playerId);
    }

    handleAnswerMessage(msg: Messages.answer) {
        const playerId = msg.playerId;
        if (playerId && this.playerMap[playerId]) {
            const playerPeer = this.playerMap[playerId];
            const answer = new RTCSessionDescription({ type: 'answer', sdp: msg.sdp });
            playerPeer.peerConnection.setRemoteDescription(answer);
        }
    }

    handleIceMessage(msg: Messages.iceCandidate) {
        const playerId = msg.playerId;
        if (playerId && this.playerMap[playerId]) {
            const playerPeer = this.playerMap[playerId];
            const candidate = new RTCIceCandidate(msg.candidate);
            playerPeer.peerConnection.addIceCandidate(candidate);
        }
    }

    mungeOffer(offerSDP: string): string {
        if (this.settings.WebRTC.AbsCaptureTimeHeaderExt) {
            // Add the abs-capture-time header extension to the sdp extmap
            const kAbsCaptureTime = 'http://www.webrtc.org/experiments/rtp-hdrext/abs-capture-time';
            return SDPUtils.addVideoHeaderExtensionToSdp(offerSDP, kAbsCaptureTime);
        }
        return offerSDP;
    }

    sendDataProtocol(playerId: string) {
        const playerPeer = this.playerMap[playerId];
        if (playerPeer) {
            const streamerProto = {
                Direction: 0
            };
            for (const [messageName, messageDef] of Object.entries(DataProtocol.ToStreamer)) {
                streamerProto[messageName] = { id: messageDef.id, structure: [] };
                for (const struct of messageDef.structure) {
                    streamerProto[messageName].structure.push(struct.type);
                }
            }
            const streamerProtoStr = JSON.stringify(streamerProto);
            const streamerBuffer = this.constructMessage(
                DataProtocol.FromStreamer.Protocol,
                streamerProtoStr
            );
            playerPeer.dataChannel.send(streamerBuffer);

            const playerProto = {
                Direction: 1
            };
            for (const [messageName, messageDef] of Object.entries(DataProtocol.FromStreamer)) {
                streamerProto[messageName] = { id: messageDef.id, structure: [] };
                for (const struct of messageDef.structure) {
                    streamerProto[messageName].structure.push(struct.type);
                }
            }
            const playerProtoStr = JSON.stringify(playerProto);
            const playerBuffer = this.constructMessage(DataProtocol.FromStreamer.Protocol, playerProtoStr);
            playerPeer.dataChannel.send(playerBuffer);
        }
    }

    sendInitialSettings(playerId: string) {
        const playerPeer = this.playerMap[playerId];
        if (playerPeer) {
            const settingsStr = JSON.stringify(this.settings);
            const settingsBuffer = this.constructMessage(
                DataProtocol.FromStreamer.InitialSettings,
                settingsStr
            );
            playerPeer.dataChannel.send(settingsBuffer);
        }
    }

    constructMessage(messageDef: any, ...args: any[]): ArrayBuffer {
        let dataSize = 0;
        let argIndex = 0;

        if (messageDef.structure.length != args.length) {
            throw new Error(
                `Incorrect number of parameters given to constructMessage. Got ${args.length}, expected ${messageDef.structure.length}`
            );
        }

        dataSize += 1; // message type
        // fields
        messageDef.structure.forEach((param: any) => {
            switch (param.type) {
                case 'uint8':
                    dataSize += 1;
                    break;
                case 'uint16':
                    dataSize += 2;
                    break;
                case 'int16':
                    dataSize += 2;
                    break;
                case 'float':
                    dataSize += 4;
                    break;
                case 'double':
                    dataSize += 8;
                    break;
                case 'string':
                    {
                        // size prepended string
                        const strVal = args[argIndex] as string;
                        dataSize += 2;
                        dataSize += 2 * strVal.length;
                    }
                    break;
                case 'only_string':
                    {
                        // string takes up the full message
                        const val = args[argIndex];
                        const strVal = typeof val == 'string' ? val : JSON.stringify(val);
                        dataSize += 2 * strVal.length;
                    }
                    break;
            }
            argIndex += 1;
        });

        const data = new DataView(new ArrayBuffer(dataSize));

        dataSize = 0;
        argIndex = 0;

        data.setUint8(dataSize, messageDef.id);
        dataSize += 1;
        messageDef.structure.forEach((param: any) => {
            switch (param.type) {
                case 'uint8':
                    data.setUint8(dataSize, args[argIndex] as number);
                    dataSize += 1;
                    break;
                case 'uint16':
                    data.setUint16(dataSize, args[argIndex] as number, true);
                    dataSize += 2;
                    break;
                case 'int16':
                    data.setInt16(dataSize, args[argIndex] as number, true);
                    dataSize += 2;
                    break;
                case 'float':
                    data.setFloat32(dataSize, args[argIndex] as number, true);
                    dataSize += 4;
                    break;
                case 'double':
                    data.setFloat64(dataSize, args[argIndex] as number, true);
                    dataSize += 8;
                    break;
                case 'string':
                    {
                        const strVal = args[argIndex] as string;
                        data.setUint16(dataSize, strVal.length, true);
                        dataSize += 2;
                        for (let i = 0; i < strVal.length; ++i) {
                            data.setUint16(dataSize, strVal.charCodeAt(i), true);
                            dataSize += 2;
                        }
                    }
                    break;
                case 'only_string':
                    {
                        const strVal = args[argIndex] as string;
                        for (let i = 0; i < strVal.length; ++i) {
                            data.setUint16(dataSize, strVal.charCodeAt(i), true);
                            dataSize += 2;
                        }
                    }
                    break;
            }
            argIndex += 1;
        });

        return data.buffer;
    }

    deconstructMessage(message: Uint8Array) {
        const data = new DataView(message.buffer);
        let dataOffset = 0;

        // read the message type
        const messageType = data.getUint8(dataOffset);
        dataOffset += 1;

        // get the message definition
        const messageDef = (() => {
            for (const def of Object.values(DataProtocol.ToStreamer)) {
                if (def.id == messageType) {
                    return def;
                }
            }
            return null;
        })();

        if (!messageDef) {
            console.log(`Unable to deconstruct message. Unknown message type: ${messageType}`);
            return null;
        }

        const resultMessage = {};
        messageDef.structure.forEach((param: any) => {
            let value: any;
            switch (param.type) {
                case 'uint8':
                    value = data.getUint8(dataOffset);
                    dataOffset += 1;
                    break;
                case 'uint16':
                    value = data.getUint16(dataOffset, true);
                    dataOffset += 2;
                    break;
                case 'int16':
                    value = data.getInt16(dataOffset, true);
                    dataOffset += 2;
                    break;
                case 'float':
                    value = data.getFloat32(dataOffset, true);
                    dataOffset += 4;
                    break;
                case 'double':
                    value = data.getFloat64(dataOffset, true);
                    dataOffset += 8;
                    break;
                case 'string':
                    {
                        const strLen = data.getUint16(dataOffset, true);
                        dataOffset += 2;
                        const textDecoder = new TextDecoder('utf-16');
                        value = textDecoder.decode(data.buffer.slice(dataOffset, dataOffset + strLen * 2));
                        dataOffset += strLen;
                    }
                    break;
                case 'only_string':
                    {
                        const textDecoder = new TextDecoder('utf-16');
                        value = textDecoder.decode(data.buffer.slice(1));
                    }
                    break;
            }
            resultMessage[param.name] = value;
        });

        return { type: messageType, message: resultMessage };
    }

    handleDataChannelMessage(playerId: string, message: Uint8Array) {
        const result = this.deconstructMessage(message);
        this.emit('data_channel_message', playerId, result);
    }
}
