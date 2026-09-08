import { test, expect } from '@playwright/test';
import * as path from 'path';

function delay(time: number) {
  return new Promise(function(resolve) { 
    setTimeout(resolve, time)
  });
}

async function startAndWaitForVideo(page: Page) {
    await page.evaluate(()=> {
        return new Promise((resolve) => {
            window.pixelStreaming.addEventListener('playStream', (event) => {
                return resolve(event);
            });
            // Start the stream now we have listener attached
            window.pixelStreaming.connect();
        });
    });
}

// just quickly test that the default stream is working
test('Test default stream.', async ({ page }, testinfo) => {

    // set a long timeout to allow for slow software rendering
    test.setTimeout(2 * 60 * 1000);

    // INVESTIGATION ONLY: surface browser-side errors so a stream that never
    // starts leaves something diagnosable behind.
    page.on('console', msg => console.log(`[browser:${msg.type()}] ${msg.text()}`));
    page.on('pageerror', err => console.log(`[pageerror] ${err.message}`));

    await page.goto("/?StreamerId=DefaultStreamer");

    // wait until we get a stream
    try {
        await startAndWaitForVideo(page);
    } catch (e) {
        const diag = await page.evaluate(() => {
            const ps = (window as any).pixelStreaming;
            const pc = ps?.webRtcController?.peerConnectionController?.peerConnection;
            return {
                signalingState: pc?.signalingState,
                iceConnectionState: pc?.iceConnectionState,
                connectionState: pc?.connectionState,
                remoteSdp: pc?.remoteDescription?.sdp,
                localSdp: pc?.localDescription?.sdp
            };
        }).catch(() => null);
        console.log('[diag] peer connection:', JSON.stringify(diag, null, 2));
        throw e;
    }

    // let the stream run for a small duration
    await delay(15000);

    // query the frontend for its calculated stats
    let frameCount: number = await page.evaluate(()=> {
        return new Promise<number>((resolve) => {
            window.pixelStreaming.addEventListener("statsReceived", (e) => {
                if(e.data.aggregatedStats && e.data.aggregatedStats.inboundVideoStats && e.data.aggregatedStats.inboundVideoStats.framesReceived) {
                    resolve(e.data.aggregatedStats.inboundVideoStats.framesReceived);
                }
            });
        });
    });

    // take a screenshot for posterity
    const __dirname = path.dirname(__filename);
    const screenshot = await page.screenshot({
        path: path.join(__dirname, '..', 'StreamResult.png'),
        fullPage: false
    });
    testinfo.attach('screenshot', { body: screenshot, contentType: 'image/png' });

    // pass the test if we recorded any frames
    expect(frameCount).toBeGreaterThan(0);
});

