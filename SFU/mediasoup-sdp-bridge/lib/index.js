"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRtpCapabilities2 = exports.generateRtpCapabilities1 = exports.generateRtpCapabilities0 = exports.createSdpEndpoint = exports.SdpEndpoint = void 0;
const MsSdpUtils = __importStar(require("mediasoup-client/lib/handlers/sdp/commonUtils"));
const RemoteSdp_1 = require("mediasoup-client/lib/handlers/sdp/RemoteSdp");
const SdpTransform = __importStar(require("sdp-transform"));
const uuid_1 = require("uuid");
const BrowserRtpCapabilities = __importStar(require("./BrowserRtpCapabilities"));
const SdpUtils = __importStar(require("./SdpUtils"));
const MediaSection_1 = require("mediasoup-client/lib/handlers/sdp/MediaSection");
require("util").inspect.defaultOptions.depth = null;
class SdpEndpoint {
    constructor(webRtcTransport, localCaps) {
        this.producers = [];
        this.producerMedias = [];
        this.consumers = [];
        this.webRtcTransport = webRtcTransport;
        this.transport = webRtcTransport;
        this.localCaps = localCaps;
        this.sctpMedia = null;
        this.consumeData = false;
    }
    async processOffer(sdpOffer) {
        if (this.remoteSdp) {
            console.error("[SdpEndpoint.processOffer] ERROR: A remote description was already set");
            return [];
        }
        this.remoteSdp = sdpOffer;
        const remoteSdpObj = SdpTransform.parse(sdpOffer);
        await this.webRtcTransport.connect({
            dtlsParameters: MsSdpUtils.extractDtlsParameters({
                sdpObject: remoteSdpObj,
            }),
        });
        for (const media of remoteSdpObj.media) {
            if (media.type == "application") {
                this.sctpMedia = media;
                console.log("[SdpEndpoint.processOffer] SCTP association received");
            }
            else {
                if (!("rtp" in media)) {
                    continue;
                }
                if (!("direction" in media)) {
                    continue;
                }
                if (media.direction !== "sendonly") {
                    continue;
                }
                const sendParams = SdpUtils.sdpToSendRtpParameters(remoteSdpObj, media, this.localCaps, media.type);
                let producer;
                try {
                    producer = await this.transport.produce({
                        kind: media.type,
                        rtpParameters: sendParams,
                        paused: false,
                    });
                }
                catch (err) {
                    console.error("FIXME BUG:", err);
                    process.exit(1);
                }
                this.producers.push(producer);
                this.producerMedias.push(media);
                console.log("[SdpEndpoint.processOffer] mediasoup Producer created, kind: %s, type: %s, paused: %s", producer.kind, producer.type, producer.paused);
            }
        }
        return this.producers;
    }
    createAnswer() {
        if (this.localSdp) {
            console.error("[SdpEndpoint.createAnswer] ERROR: A local description was already set");
            return "";
        }
        const sdpBuilder = new RemoteSdp_1.RemoteSdp({
            iceParameters: this.webRtcTransport.iceParameters,
            iceCandidates: this.webRtcTransport.iceCandidates,
            dtlsParameters: this.webRtcTransport.dtlsParameters,
            sctpParameters: this.webRtcTransport.sctpParameters,
            planB: false,
        });
        console.log("[SdpEndpoint.createAnswer] Make 'recvonly' SDP Answer");
        for (let i = 0; i < this.producers.length; i++) {
            const sdpMediaObj = this.producerMedias[i];
            const recvParams = this.producers[i].rtpParameters;
            sdpBuilder.send({
                offerMediaObject: sdpMediaObj,
                reuseMid: undefined,
                offerRtpParameters: recvParams,
                answerRtpParameters: recvParams,
                codecOptions: undefined,
                extmapAllowMixed: false,
            });
        }
        if (this.sctpMedia != null) {
            sdpBuilder.sendSctpAssociation({offerMediaObject: this.sctpMedia});
        }
        this.localSdp = sdpBuilder.getSdp();
        return this.localSdp;
    }
    addConsumer(consumer) {
        this.consumers.push(consumer);
    }
    addConsumeData() {
        this.consumeData = true;
    }
    createOffer() {
        var _a;
        if (this.localSdp) {
            console.error("[SdpEndpoint.createOffer] ERROR: A local description was already set");
            return "";
        }
        const sdpBuilder = new RemoteSdp_1.RemoteSdp({
            iceParameters: this.webRtcTransport.iceParameters,
            iceCandidates: this.webRtcTransport.iceCandidates,
            dtlsParameters: this.webRtcTransport.dtlsParameters,
            sctpParameters: this.webRtcTransport.sctpParameters,
            planB: false,
        });
        const sendMsid = uuid_1.v4().substr(0, 8);
        console.log("[SdpEndpoint.createOffer] Make 'sendonly' SDP Offer");
        for (let i = 0; i < this.consumers.length; i++) {
            const mid = (_a = this.consumers[i].rtpParameters.mid) !== null && _a !== void 0 ? _a : "nomid";
            const kind = this.consumers[i].kind;
            const sendParams = this.consumers[i].rtpParameters;
            sdpBuilder.receive({
                mid,
                kind,
                offerRtpParameters: sendParams,
                streamId: sendMsid,
                trackId: `${sendMsid}-${kind}`,
            });
        }
        if (this.consumeData) {
            sdpBuilder.receiveSctpAssociation();
        }
        this.localSdp = sdpBuilder.getSdp();
        return this.localSdp;
    }
    async processAnswer(sdpAnswer) {
        if (this.remoteSdp) {
            console.error("[SdpEndpoint.processAnswer] ERROR: A remote description was already set");
            return;
        }
        this.remoteSdp = sdpAnswer;
        const remoteSdpObj = SdpTransform.parse(sdpAnswer);
        await this.webRtcTransport.connect({
            dtlsParameters: MsSdpUtils.extractDtlsParameters({
                sdpObject: remoteSdpObj,
            }),
        });
        {
        }
    }
}
exports.SdpEndpoint = SdpEndpoint;
function createSdpEndpoint(webRtcTransport, localCaps) {
    return new SdpEndpoint(webRtcTransport, localCaps);
}
exports.createSdpEndpoint = createSdpEndpoint;
function generateRtpCapabilities0() {
    return BrowserRtpCapabilities.chrome;
}
exports.generateRtpCapabilities0 = generateRtpCapabilities0;
function generateRtpCapabilities1(localCaps, remoteSdp) {
    console.error("[SdpEndpoint.generateRtpCapabilities1] BUG: Not implemented");
    process.exit(1);
    let caps;
    return caps;
}
exports.generateRtpCapabilities1 = generateRtpCapabilities1;
function generateRtpCapabilities2(localCaps, remoteCaps) {
    console.error("[SdpEndpoint.generateRtpCapabilities2] BUG: Not implemented");
    process.exit(1);
    let caps;
    return caps;
}
exports.generateRtpCapabilities2 = generateRtpCapabilities2;
//# sourceMappingURL=index.js.map