// Copyright Epic Games, Inc. All Rights Reserved.

/**
 * Keeps a streamer's own network addresses away from the players it streams to.
 *
 * A streamer announces every address it can be reached on: its LAN address, its public address
 * (the server reflexive candidate), its IPv6 addresses, usually globally routable, and - in the
 * related address of each relay candidate - its public address once more. When the media is
 * relayed a player needs none of them, and for a streamer on a home network each one tells any
 * viewer where that network is.
 *
 * So only relay candidates reach a player, with their related address zeroed. This is half of the
 * arrangement: the streamer still sends connectivity checks from its own addresses to whatever
 * candidates a player announces, which would show the player that address anyway. The player must
 * therefore be limited to relay candidates as well (iceTransportPolicy "relay" in its peer options),
 * which leaves those checks nowhere to arrive.
 */

/** What a player may be sent in place of one streamer ICE candidate. */
export type CandidateVerdict = { forward: true; candidate: string } | { forward: false; type: string };

/** A streamer SDP as a player may see it. */
export interface SdpVerdict {
    sdp: string;
    // The types of the candidate lines taken out, for logging. Never their addresses.
    withheld: string[];
}

// RFC 8839: candidate:<foundation> <component> <transport> <priority> <address> <port> typ <type> ...
// The keyword sits at a fixed position, and the extension attributes (raddr, rport, ...) follow the
// type, so they are only looked for from there on.
const TYP_INDEX = 6;
const EXTENSIONS_INDEX = TYP_INDEX + 2;

// Reported as the type of anything that cannot be read as a candidate.
const UNPARSEABLE = 'unparseable';

// Lines whose last field is an address: the connection line, the RTCP attribute and the origin line.
// JSEP (RFC 8829) itself recommends a meaningless origin address, so all three can be zeroed.
const ADDRESS_LINE = /^(c=|a=rtcp:\S+ |o=\S+ \S+ \S+ )IN IP([46]) \S+\s*$/;

/**
 * Decides what a player may see of one streamer candidate, given as it appears in a trickled
 * candidate or as an SDP line (with a leading `a=`). An empty candidate is the end-of-candidates
 * marker and passes unchanged. Anything that does not parse - including a value that is not a
 * string at all, since it arrives as whatever JSON the streamer sent - cannot be shown to be safe, so
 * it is withheld like any non-relay candidate.
 */
export function scrubStreamerCandidate(candidate: unknown): CandidateVerdict {
    if (typeof candidate !== 'string') {
        return { forward: false, type: UNPARSEABLE };
    }
    if (candidate.trim() === '') {
        return { forward: true, candidate };
    }
    // One candidate per line. A line break inside the value means it is not a single candidate.
    if (/[\r\n]/.test(candidate.trim())) {
        return { forward: false, type: UNPARSEABLE };
    }

    const fields = candidate.trim().split(/\s+/);
    if (fields[TYP_INDEX] !== 'typ') {
        return { forward: false, type: UNPARSEABLE };
    }
    const type = fields[TYP_INDEX + 1] ?? UNPARSEABLE;
    if (type !== 'relay') {
        return { forward: false, type };
    }

    // libwebrtc fills a relay candidate's related address with the streamer's public address.
    setValueAfter(fields, 'raddr', '0.0.0.0');
    setValueAfter(fields, 'rport', '0');
    return { forward: true, candidate: fields.join(' ') };
}

/**
 * Returns a streamer offer or answer as a player may see it: non-relay candidate lines removed,
 * relay ones scrubbed as in scrubStreamerCandidate, and every address field zeroed.
 */
export function scrubStreamerSdp(sdp: string): SdpVerdict {
    const eol = sdp.includes('\r\n') ? '\r\n' : '\n';
    const withheld: string[] = [];
    const lines: string[] = [];

    // Split on either ending, so a bare LF inside a CRLF SDP is still a line of its own.
    for (const line of sdp.split(/\r?\n/)) {
        if (line.startsWith('a=candidate:')) {
            const verdict = scrubStreamerCandidate(line);
            if (verdict.forward) {
                lines.push(verdict.candidate);
            } else {
                withheld.push(verdict.type);
            }
        } else {
            lines.push(zeroAddress(line));
        }
    }

    return { sdp: lines.join(eol), withheld };
}

function setValueAfter(fields: string[], key: string, value: string): void {
    const index = fields.indexOf(key, EXTENSIONS_INDEX);
    if (index >= 0 && index + 1 < fields.length) {
        fields[index + 1] = value;
    }
}

function zeroAddress(line: string): string {
    const match = ADDRESS_LINE.exec(line);
    if (!match) {
        return line;
    }
    const [, prefix, family] = match;
    return `${prefix}IN IP${family} ${family === '4' ? '0.0.0.0' : '::'}`;
}
