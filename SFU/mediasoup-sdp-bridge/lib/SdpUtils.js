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
exports.sdpToSendRtpParameters = exports.sdpToRecvRtpCapabilities = void 0;
const MsRtpUtils = __importStar(require("mediasoup-client/lib/handlers/sdp/unifiedPlanUtils"));
const MsSdpUtils = __importStar(require("mediasoup-client/lib/handlers/sdp/commonUtils"));
const MsOrtc = __importStar(require("mediasoup-client/lib/ortc"));
require("util").inspect.defaultOptions.depth = null;
function sdpToRecvRtpCapabilities(sdpObject, localCaps) {
    const caps = MsSdpUtils.extractRtpCapabilities({
        sdpObject,
    });
    try {
        MsOrtc.validateRtpCapabilities(caps);
    }
    catch (err) {
        console.error("FIXME BUG:", err);
        process.exit(1);
    }
    const extendedCaps = MsOrtc.getExtendedRtpCapabilities(caps, localCaps);
    const recvCaps = MsOrtc.getRecvRtpCapabilities(extendedCaps);
    {
    }
    return recvCaps;
}
exports.sdpToRecvRtpCapabilities = sdpToRecvRtpCapabilities;
function sdpToSendRtpParameters(sdpObject, sdpMediaObj, localCaps, kind) {
    var _a;
    const caps = MsSdpUtils.extractRtpCapabilities({
        sdpObject,
    });
    try {
        MsOrtc.validateRtpCapabilities(caps);
    }
    catch (err) {
        console.error("FIXME BUG:", err);
        process.exit(1);
    }
    const extendedCaps = MsOrtc.getExtendedRtpCapabilities(caps, localCaps);
    const sendParams = MsOrtc.getSendingRemoteRtpParameters(kind, extendedCaps);
    // const sdpMediaObj = (sdpObject.media || []).find((m) => m.type === kind) ||
    //     {};
    if ("mid" in sdpMediaObj) {
        sendParams.mid = String(sdpMediaObj.mid);
    }
    else {
        sendParams.mid = kind === "audio" ? "0" : "1";
    }
    if ("rids" in sdpMediaObj) {
        for (const mediaRid of sdpMediaObj.rids) {
            (_a = sendParams.encodings) === null || _a === void 0 ? void 0 : _a.push({ rid: mediaRid.id });
        }
    }
    else {
        // sendParams.encodings = MsRtpUtils.getRtpEncodings({
        //     sdpObject,
        //     kind,
        // });
        sendParams.encodings = MsRtpUtils.getRtpEncodings({ offerMediaObject: sdpMediaObj });
    }
    sendParams.rtcp = {
        cname: MsSdpUtils.getCname({ offerMediaObject: sdpMediaObj }),
        reducedSize: "rtcpRsize" in sdpMediaObj && sdpMediaObj.rtcpRsize,
        mux: "rtcpMux" in sdpMediaObj && sdpMediaObj.rtcpMux,
    };
    {
    }
    return sendParams;
}
exports.sdpToSendRtpParameters = sdpToSendRtpParameters;
//# sourceMappingURL=SdpUtils.js.map