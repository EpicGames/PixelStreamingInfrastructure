// The jsdom test environment does not provide TextEncoder/TextDecoder, which the data channel
// message handlers use. Install Node's implementations in every test file. This can't go in the
// jest config's `globals`: Jest sends that config to its worker processes as JSON, which drops
// these classes, so they would only exist when the tests run in band.
const { TextDecoder, TextEncoder } = require('util');

if (typeof globalThis.TextDecoder === 'undefined') {
    globalThis.TextDecoder = TextDecoder;
}
if (typeof globalThis.TextEncoder === 'undefined') {
    globalThis.TextEncoder = TextEncoder;
}
