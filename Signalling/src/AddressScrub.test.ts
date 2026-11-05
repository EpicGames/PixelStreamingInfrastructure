// Copyright Epic Games, Inc. All Rights Reserved.
import { scrubStreamerCandidate, scrubStreamerSdp } from './AddressScrub';

// The streamer's own addresses, which no output may contain.
const LAN_IP = '192.168.1.20';
const PUBLIC_IP = '147.32.71.8';
const IPV6 = '2a00:1028:1234:5678::20';
const MDNS = '4f2a6c3e-1b2c-4d5e-8f90-123456789abc.local';
// The relay's address, which is what a player is supposed to see.
const RELAY_IP = '203.0.113.10'; // RFC 5737 documentation address

// Shaped as libwebrtc emits them.
const HOST = `candidate:2999745851 1 udp 2122260223 ${LAN_IP} 54321 typ host generation 0 ufrag abcd network-id 1`;
const HOST_IPV6 = `candidate:1 1 udp 2122262783 ${IPV6} 54322 typ host generation 0 ufrag abcd network-id 2`;
const HOST_MDNS = `candidate:5 1 udp 2122260223 ${MDNS} 54321 typ host generation 0`;
const HOST_TCP = `candidate:4 1 tcp 1518280447 ${LAN_IP} 9 typ host tcptype active generation 0`;
const SRFLX = `candidate:842163049 1 udp 1686052607 ${PUBLIC_IP} 54321 typ srflx raddr ${LAN_IP} rport 54321 generation 0 ufrag abcd network-id 1`;
const PRFLX = `candidate:3 1 udp 1845501695 ${PUBLIC_IP} 60000 typ prflx raddr ${LAN_IP} rport 54321 generation 0`;
const RELAY = `candidate:1234567 1 udp 41885439 ${RELAY_IP} 49218 typ relay raddr ${PUBLIC_IP} rport 54321 generation 0 ufrag abcd network-id 1`;
const RELAY_SCRUBBED = `candidate:1234567 1 udp 41885439 ${RELAY_IP} 49218 typ relay raddr 0.0.0.0 rport 0 generation 0 ufrag abcd network-id 1`;

const OWN_ADDRESSES = [LAN_IP, PUBLIC_IP, IPV6, MDNS];

function expectNoOwnAddress(text: string): void {
    for (const address of OWN_ADDRESSES) {
        expect(text).not.toContain(address);
    }
}

describe('scrubStreamerCandidate', () => {
    it.each([
        ['host', 'IPv4', HOST],
        ['host', 'IPv6', HOST_IPV6],
        ['host', 'mDNS', HOST_MDNS],
        ['host', 'TCP', HOST_TCP],
        ['srflx', 'public address', SRFLX],
        ['prflx', 'public address', PRFLX]
    ])('withholds a %s candidate (%s), reporting only its type', (type, _variant, candidate) => {
        expect(scrubStreamerCandidate(candidate)).toEqual({ forward: false, type });
    });

    it('forwards a relay candidate with its related address zeroed and everything else intact', () => {
        expect(scrubStreamerCandidate(RELAY)).toEqual({ forward: true, candidate: RELAY_SCRUBBED });
    });

    it('keeps the a= prefix of an SDP candidate line', () => {
        expect(scrubStreamerCandidate(`a=${RELAY}`)).toEqual({
            forward: true,
            candidate: `a=${RELAY_SCRUBBED}`
        });
    });

    it('forwards a relay candidate that has no related address unchanged', () => {
        const relay = `candidate:1 1 udp 41885439 ${RELAY_IP} 49218 typ relay generation 0`;
        expect(scrubStreamerCandidate(relay)).toEqual({ forward: true, candidate: relay });
    });

    it('passes the end-of-candidates marker unchanged', () => {
        expect(scrubStreamerCandidate('')).toEqual({ forward: true, candidate: '' });
    });

    it('forwards a relay candidate with trailing whitespace, trimmed and scrubbed', () => {
        expect(scrubStreamerCandidate(`${RELAY}\n`)).toEqual({ forward: true, candidate: RELAY_SCRUBBED });
    });

    it('withholds a value with a line break inside it, even when a relay candidate comes first', () => {
        expect(scrubStreamerCandidate(`${RELAY}\na=${HOST}`)).toEqual({
            forward: false,
            type: 'unparseable'
        });
    });

    it.each([
        'garbage',
        `candidate:1 1 udp 1 ${PUBLIC_IP} 5000 relay`,
        'candidate:1 1 udp 1 1.2.3.4 5000 typ'
    ])('withholds a line it cannot parse: %s', (candidate) => {
        expect(scrubStreamerCandidate(candidate)).toEqual({ forward: false, type: 'unparseable' });
    });

    // The candidate arrives as whatever JSON the streamer sent, whatever the message type says.
    it.each([undefined, null, 42, { candidate: RELAY }])(
        'withholds a candidate that is not a string: %p',
        (candidate) => {
            expect(scrubStreamerCandidate(candidate)).toEqual({ forward: false, type: 'unparseable' });
        }
    );
});

describe('scrubStreamerSdp', () => {
    const offer = [
        'v=0',
        'o=- 4611731400430051336 2 IN IP4 ' + PUBLIC_IP,
        's=-',
        't=0 0',
        'a=group:BUNDLE 0',
        'm=video 54321 UDP/TLS/RTP/SAVPF 96',
        'c=IN IP4 ' + PUBLIC_IP,
        'a=rtcp:54321 IN IP4 ' + PUBLIC_IP,
        'a=' + HOST,
        'a=' + HOST_IPV6,
        'a=' + SRFLX,
        'a=' + RELAY,
        'a=ice-ufrag:abcd',
        'a=mid:0',
        ''
    ].join('\r\n');

    it('removes every non-relay candidate line and reports only their types', () => {
        const { sdp, withheld } = scrubStreamerSdp(offer);
        expect(withheld).toEqual(['host', 'host', 'srflx']);
        expect(sdp).toContain('a=' + RELAY_SCRUBBED);
        expectNoOwnAddress(sdp);
    });

    it('zeroes the connection, RTCP and origin addresses, IPv4 and IPv6 alike', () => {
        const { sdp } = scrubStreamerSdp(offer + 'c=IN IP6 ' + IPV6 + '\r\n');
        expect(sdp).toContain('\r\nc=IN IP4 0.0.0.0\r\n');
        expect(sdp).toContain('\r\na=rtcp:54321 IN IP4 0.0.0.0\r\n');
        expect(sdp).toContain('\r\no=- 4611731400430051336 2 IN IP4 0.0.0.0\r\n');
        expect(sdp).toContain('\r\nc=IN IP6 ::\r\n');
    });

    it('leaves every other line, and the CRLF line endings, exactly as they were', () => {
        const otherLines = (text: string) =>
            text.split('\r\n').filter((line) => !/^(a=candidate:|c=|a=rtcp:|o=)/.test(line));
        const { sdp } = scrubStreamerSdp(offer);
        expect(otherLines(sdp)).toEqual(otherLines(offer));
        expect(sdp.replace(/\r\n/g, '')).not.toContain('\n');
    });

    it('handles an SDP written with bare LF line endings', () => {
        const { sdp, withheld } = scrubStreamerSdp(offer.replace(/\r\n/g, '\n'));
        expect(withheld).toEqual(['host', 'host', 'srflx']);
        expect(sdp).not.toContain('\r');
        expectNoOwnAddress(sdp);
    });

    it('scrubs an SDP whose line endings are mixed, with a bare LF before an address line', () => {
        // Every line ends CRLF except the one before the c= line, which ends with a bare LF.
        const mixed = [
            'v=0',
            'o=- 4611731400430051336 2 IN IP4 ' + PUBLIC_IP,
            'm=video 54321 UDP/TLS/RTP/SAVPF 96',
            'c=IN IP4 ' + PUBLIC_IP,
            'a=' + SRFLX,
            'a=' + RELAY,
            ''
        ]
            .join('\r\n')
            .replace('\r\nc=IN IP4', '\nc=IN IP4');
        const { sdp, withheld } = scrubStreamerSdp(mixed);
        expect(withheld).toEqual(['srflx']);
        expect(sdp).toContain('a=' + RELAY_SCRUBBED);
        expectNoOwnAddress(sdp);
    });

    it('zeroes an address line that has trailing whitespace', () => {
        const { sdp } = scrubStreamerSdp(`c=IN IP4 ${PUBLIC_IP} \r\na=mid:0\r\n`);
        expect(sdp).toBe('c=IN IP4 0.0.0.0\r\na=mid:0\r\n');
    });

    it('leaves an SDP without candidates or addresses unchanged', () => {
        const plain = 'v=0\r\ns=-\r\nt=0 0\r\na=mid:0\r\n';
        expect(scrubStreamerSdp(plain)).toEqual({ sdp: plain, withheld: [] });
    });
});
