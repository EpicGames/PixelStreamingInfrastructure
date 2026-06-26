import { test } from './fixtures';
import { expect } from './matchers';
import * as helpers from './helpers';
import { StatsReceivedEvent } from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.8';

// NOTE: add a new test to check qp values

// just quickly test that the default stream is working
test('Test default stream.', {
    tag: ['@basic'],
}, async ({ page, streamerId }) => {

    await page.goto(`/?StreamerId=${streamerId}`);

    // let the stream run for a short duration
    await helpers.startAndWaitForVideo(page);

    let frameCount: number = await page.evaluate(()=> {
        return new Promise<number>((resolve) => {
            window.pixelStreaming.addEventListener("statsReceived", (e: StatsReceivedEvent) => {
                if(e.data.aggregatedStats && e.data.aggregatedStats.inboundVideoStats && e.data.aggregatedStats.inboundVideoStats.framesReceived) {
                    resolve(e.data.aggregatedStats.inboundVideoStats.framesReceived);
                }
            });
        });
    });

    // pass the test if we recorded any frames
    expect(frameCount).toBeGreaterThan(0);
});



