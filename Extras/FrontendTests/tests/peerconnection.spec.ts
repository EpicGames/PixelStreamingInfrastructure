import { test } from './fixtures';
import { expect } from './matchers';
import * as helpers from './helpers';
import { Flags, PixelStreaming, WebRtcSdpAnswerEvent, WebRtcSdpOfferEvent, LatencyCalculator, LatencyInfo, LatencyCalculatedEvent } from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.8';

test('Test abs-capture-time header extension found for streamer', {
    tag: ['@capture-time'],
}, async ({ page, streamerPage, streamerId, browserName }) => {

    if(browserName !== 'chromium') {
        // Chrome based browsers are the only ones that support.
        test.skip();
    }

    const localDescription: Promise<RTCSessionDescriptionInit> = new Promise(async (resolve) => {

        // Expose the resolve function to the browser context
        await streamerPage.exposeFunction('resolveFromLocalDescriptionPromise', resolve);

        streamerPage.evaluate(() => {
            window.streamer.on('local_description_set', (localDescription: RTCSessionDescriptionInit) => {
                resolveFromLocalDescriptionPromise(localDescription);
            });
        });
    });

    await page.goto(`/?StreamerId=${streamerId}`);
    await page.waitForLoadState("load");

    // Wait for the sdp offer
    let getSdpOffer = new Promise<RTCSessionDescriptionInit>(async (resolve) => {

        // Expose the resolve function to the browser context
        await page.exposeFunction('resolveFromSdpOfferPromise', resolve);

        page.evaluate(() => {
            window.pixelStreaming.addEventListener("webRtcSdpOffer", (e: WebRtcSdpOfferEvent) => {
                resolveFromSdpOfferPromise(e.data.sdp);
            });
        });

    });

    await helpers.startAndWaitForVideo(page);

    let localDescSdp: RTCSessionDescriptionInit = await localDescription;
    let remoteDescSdp: RTCSessionDescriptionInit = await getSdpOffer;

    expect(localDescSdp.sdp).toBeDefined();
    expect(remoteDescSdp.sdp).toBeDefined();

    // If this string is found in the sdp we can say we have turned on the capture time header extension on the streamer
    expect(localDescSdp.sdp).toContain("abs-capture-time");
    expect(remoteDescSdp.sdp).toContain("abs-capture-time");
});

test('Test abs-capture-time header extension found in PSInfra frontend', {
    tag: ['@capture-time'],
}, async ({ page, streamerPage, streamerId, browserName }) => {

    if(browserName !== 'chromium') {
        // Chrome based browsers are the only ones that support.
        test.skip();
    }

    await page.goto(`/?StreamerId=${streamerId}`);

    await page.waitForLoadState("load");

    // Enable the flag for the capture extension
    await page.evaluate(() => {
        window.pixelStreaming.config.setFlagEnabled("EnableCaptureTimeExt", true);
    });

    // Wait for the sdp answer
    let getSdpAnswer = new Promise<RTCSessionDescriptionInit>(async (resolve) => {

        // Expose the resolve function to the browser context
        await page.exposeFunction('resolveFromSdpAnswerPromise', resolve);

        page.evaluate(() => {
            window.pixelStreaming.addEventListener("webRtcSdpAnswer", (e: WebRtcSdpAnswerEvent) => {
                resolveFromSdpAnswerPromise(e.data.sdp);
            });
        });

    });

    await helpers.startAndWaitForVideo(page);
    const answer: RTCSessionDescriptionInit = await getSdpAnswer;

    expect(answer).toBeDefined();
    expect(answer.sdp).toBeDefined();

    // If this string is found in the sdp we can say we have turned on the capture time header extension on the streamer
    expect(answer.sdp).toContain("abs-capture-time");
});

test('Test video-timing header extension found in PSInfra frontend', {
    tag: ['@capture-time'],
}, async ({ page, streamerPage, streamerId, browserName }) => {

    if(browserName !== 'chromium') {
        // Chrome based browsers are the only ones that support.
        test.skip();
    }

    await page.goto(`/?StreamerId=${streamerId}`);

    await page.waitForLoadState("load");

    // Wait for the sdp answer
    let getSdpAnswer = new Promise<RTCSessionDescriptionInit>(async (resolve) => {

        // Expose the resolve function to the browser context
        await page.exposeFunction('resolveFromSdpAnswerPromise', resolve);

        page.evaluate(() => {
            window.pixelStreaming.addEventListener("webRtcSdpAnswer", (e: WebRtcSdpAnswerEvent) => {
                resolveFromSdpAnswerPromise(e.data.sdp);
            });
        });

    });

    await helpers.startAndWaitForVideo(page);
    const answer: RTCSessionDescriptionInit = await getSdpAnswer;

    expect(answer).toBeDefined();
    expect(answer.sdp).toBeDefined();

    // If this string is found in the sdp we can say we have turned on the capture time header extension on the streamer
    expect(answer.sdp).toContain("video-timing");
});

test('Test latency calculation with video timing', {
    tag: ['@video-timing'],
}, async ({ page, streamerPage, streamerId, browserName }) => {

    test.skip(process.platform === 'linux', 'Flakey on linux');
    test.skip(browserName !== 'chromium', 'Chrome based browsers are the only supported browsers');

    await page.goto(`/?StreamerId=${streamerId}`);

    await page.waitForLoadState("load");

    await helpers.startAndWaitForVideo(page);

    // Wait for the latency info event to be fired
    let latencyInfo: LatencyInfo = await page.evaluate(() => {
        return new Promise((resolve) => {
            window.pixelStreaming.addEventListener("latencyCalculated", (e: LatencyCalculatedEvent) => {
                if(e.data.latencyInfo && e.data.latencyInfo.frameTiming && 
                    e.data.latencyInfo.frameTiming.captureToSendLatencyMs && 
                    e.data.latencyInfo.rttMs) {
                    resolve(e.data.latencyInfo);
                }
            });
        });
    });

    expect(latencyInfo).toBeDefined();
    expect(latencyInfo.frameTiming).toBeDefined();
    expect(latencyInfo.frameTiming?.captureToSendLatencyMs).toBeDefined();
    expect(latencyInfo.averageJitterBufferDelayMs).toBeDefined();
    expect(latencyInfo.averageProcessingDelayMs).toBeDefined();
    expect(latencyInfo.rttMs).toBeDefined();
    expect(latencyInfo.averageAssemblyDelayMs).toBeDefined();
    expect(latencyInfo.averageDecodeLatencyMs).toBeDefined();

    // Sender side latency should be less than 500ms in pure CPU test
    expect(latencyInfo.frameTiming?.captureToSendLatencyMs).toBeLessThanOrEqual(500)

    // Expect jitter buffer/processing delay to be no greater than 500ms on local link
    expect(latencyInfo.averageJitterBufferDelayMs).toBeLessThanOrEqual(500);
    expect(latencyInfo.averageProcessingDelayMs).toBeLessThanOrEqual(500);

    // Expect RTT to be less than 10ms on loopback
    expect(latencyInfo.rttMs).toBeLessThanOrEqual(10);

    // Expect time to assemble frame from packets to be less than the frame rate itself at 30 fps
    expect(latencyInfo.averageAssemblyDelayMs).toBeLessThanOrEqual(33);

    // Expect CPU decoder to at least be able to do 30 fps decode
    expect(latencyInfo.averageDecodeLatencyMs).toBeLessThanOrEqual(33);

});
