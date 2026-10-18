// Copyright Epic Games, Inc. All Rights Reserved.

/**
 * Codec options are strings of the form "<name> <fmtp line>", e.g.
 * "H265 level-id=180;profile-id=2;tier-flag=0;tx-mode=SRST". The fmtp line may be missing and its parameters may
 * come in any order.
 */
function parseCodecOption(codec: string): { name: string; parameters: Map<string, string> } {
    const [name, fmtpLine] = codec.trim().split(' ');
    const parameters = new Map<string, string>();
    for (const parameter of (fmtpLine ?? '').split(';')) {
        const [key, value] = parameter.split('=');
        if (key) {
            parameters.set(key.trim().toLowerCase(), (value ?? '').trim());
        }
    }
    return { name: (name ?? '').toUpperCase(), parameters };
}

/**
 * Returns a key that is equal for two codec options only when they describe the same codec. This mirrors WebRTC's
 * codec comparison: parameters that are negotiated rather than identifying (such as H.264 and H.265 levels) are
 * ignored, and missing parameters take their SDP defaults.
 * @param codec A codec option of the form "<name> <fmtp line>"
 * @returns The codec name followed by its identifying parameters
 */
export function getCodecIdentity(codec: string): string {
    const { name, parameters } = parseCodecOption(codec);
    const getParameter = (key: string, defaultValue: string) => parameters.get(key) ?? defaultValue;

    switch (name) {
        case 'H264': {
            // profile-level-id is the profile in its first two bytes followed by the level in its last byte
            const profile = getParameter('profile-level-id', '42e01f').substring(0, 4).toLowerCase();
            return `${name} profile=${profile};packetization-mode=${getParameter('packetization-mode', '0')}`;
        }
        case 'H265':
            return `${name} profile-id=${getParameter('profile-id', '1')};tier-flag=${getParameter('tier-flag', '0')};tx-mode=${getParameter('tx-mode', 'SRST').toUpperCase()}`;
        case 'VP9':
            return `${name} profile-id=${getParameter('profile-id', '0')}`;
        case 'AV1':
            return `${name} profile=${getParameter('profile', '0')};tier=${getParameter('tier', '0')};level-idx=${getParameter('level-idx', '5')}`;
        default:
            return name;
    }
}

/**
 * @param codec A codec capability reported by the browser
 * @returns The capability as a codec option of the form "<name> <fmtp line>"
 */
export function getCodecOption(codec: RTCRtpCodec): string {
    return codec.mimeType.split('/')[1] + ' ' + (codec.sdpFmtpLine || '');
}

/**
 * Resolves a preferred codec to the closest of the codecs that can actually be used. The preferred codec is chosen
 * before the remote peer's codecs are known (by default it is the browser's first H.264 profile), so it can be a
 * profile the remote peer never offered. Preferring it as-is would make the browser skip it and fall through to its
 * own codec order instead.
 * @param preferredCodec The codec option the user prefers
 * @param supportedCodecs The codec options that can be used
 * @returns The supported codec matching the preferred one exactly, else one describing the same codec, else the first
 * of the same codec family, or undefined when no supported codec is of the preferred codec family.
 */
export function resolvePreferredCodec(preferredCodec: string, supportedCodecs: string[]): string | undefined {
    const preferredCodecIdentity = getCodecIdentity(preferredCodec);
    const preferredCodecName = parseCodecOption(preferredCodec).name;
    return (
        supportedCodecs.find((codec) => codec === preferredCodec) ??
        supportedCodecs.find((codec) => getCodecIdentity(codec) === preferredCodecIdentity) ??
        supportedCodecs.find((codec) => parseCodecOption(codec).name === preferredCodecName)
    );
}

/**
 * Orders the browser's codec capabilities for RTCRtpTransceiver.setCodecPreferences. Capabilities matching
 * orderedCodecs come first and in that order, followed by every other capability in the browser's order so that
 * nothing the browser supports (e.g. rtx, red and ulpfec) is dropped.
 * @param capabilities The browser's codec capabilities
 * @param orderedCodecs The codec options to put first, most preferred first
 * @returns The capabilities in order of preference
 */
export function orderCodecCapabilities(capabilities: RTCRtpCodec[], orderedCodecs: string[]): RTCRtpCodec[] {
    const getRank = (codec: RTCRtpCodec) => {
        const index = orderedCodecs.indexOf(getCodecOption(codec));
        return index === -1 ? orderedCodecs.length : index;
    };
    // Array.prototype.sort is stable, so capabilities of equal rank keep the browser's order
    return [...capabilities].sort((a, b) => getRank(a) - getRank(b));
}
