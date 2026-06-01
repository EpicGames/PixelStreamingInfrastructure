import { test } from './fixtures';
import { expect } from './matchers';
import {
    PSEventTypes,
    DataChannelEvent,
    getEventSetFrom,
} from './extras';
import * as helpers from './helpers';
import { InputCoordTranslator, TranslatedCoordUnsigned } from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.8';

test('Test mouse enter/leave', {
    tag: ['@mouse'],
}, async ({ page, streamerPage, streamerId }) => {

    // // helps debugging
    // helpers.attachToConsoleEvents(streamerPage, (...args: any[]) => {
    //     console.log("Streamer: ", ...args);
    // });
    //
    // helpers.attachToConsoleEvents(page, (...args: any[]) => {
    //     console.log("Player: ", ...args);
    // });

    await page.goto(`/?StreamerId=${streamerId}&MatchViewportRes=true&HoveringMouse=true`);

    await helpers.startAndWaitForVideo(page);
    
    // reduce the size of the window so we can leave
    await page.setViewportSize({ width: 100, height: 100 });

    const playerBox = await page.locator('#videoElementParent').boundingBox();
    expect(playerBox).not.toBeNull();

    // perform the actions
    const events = await getEventSetFrom(streamerPage, async () => {
        // start outside the view
        await page.mouse.move(200, 200);
        // move to the top left of the video
        await page.mouse.move(playerBox!.x, playerBox!.y);
        // move back outside
        await page.mouse.move(150, 150);
    });

    // check we got the expected events
    const firstPlayerId = Object.keys(events)[0];
    const singlePlayerEvents = events[firstPlayerId];
    const expectedActions: DataChannelEvent[] = [
        { type: PSEventTypes.MouseEnter },
        { type: PSEventTypes.MouseLeave },
    ];
    expect(singlePlayerEvents).toContainActions(expectedActions);
});

test('Test mouse wheel', {
    tag: ['@mouse'],
}, async ({ page, streamerPage, streamerId }) => {

    // helps debugging
    // helpers.attachToConsoleEvents(streamerPage, (...args: any[]) => {
    //     console.log("Streamer: ", ...args);
    // });
    //
    // helpers.attachToConsoleEvents(page, (...args: any[]) => {
    //     console.log("Player: ", ...args);
    // });

    await page.goto(`/?StreamerId=${streamerId}&MatchViewportRes=true&HoveringMouse=false`);

    await helpers.startAndWaitForVideo(page);

    const playerBox = await page.locator('#videoElementParent').boundingBox();
    expect(playerBox).not.toBeNull();

    // click on stream to activate pointer lock
    await page.mouse.click(playerBox!.x, playerBox!.y);

    // perform the actions
    const expectedActions: DataChannelEvent[] = [];
    const events = await getEventSetFrom(streamerPage, async () => {
        await page.mouse.wheel(0, 10);
        expectedActions.push({ type: PSEventTypes.MouseWheel, delta: (n: number) => { return n < 0 } });
        await page.mouse.wheel(0, -15);
        expectedActions.push({ type: PSEventTypes.MouseWheel, delta: (n: number) => { return n > 0 } });
        await page.mouse.wheel(0, -30);
        expectedActions.push({ type: PSEventTypes.MouseWheel, delta: (n: number) => { return n > 0 } });
        await page.mouse.wheel(0, 40);
        expectedActions.push({ type: PSEventTypes.MouseWheel, delta: (n: number) => { return n < 0 } });
    });

    // check we got the expected events
    const firstPlayerId = Object.keys(events)[0];
    const singlePlayerEvents = events[firstPlayerId];
    expect(singlePlayerEvents).toContainActions(expectedActions);
});

test('Test locked mouse movement', {
    tag: ['@mouse', '@locked'],
}, async ({ page, streamerPage, streamerId, browserName }) => {

    if(browserName === 'chromium') {
        // Chrome playwright is not working with pointerlock - https://github.com/microsoft/playwright/issues/20956
        // We can remove this early exit once that is fixed.
        test.skip();
    }

    // helps debugging
    // helpers.attachToConsoleEvents(streamerPage, (...args: any[]) => {
    //     console.log("Streamer: ", ...args);
    // });
    //
    // helpers.attachToConsoleEvents(page, (...args: any[]) => {
    //     console.log("Player: ", ...args);
    // });

    await page.goto(`/?StreamerId=${streamerId}&MatchViewportRes=true&HoveringMouse=false`);

    await helpers.startAndWaitForVideo(page);

    const playerBox = await page.locator('#videoElementParent').boundingBox();
    expect(playerBox).not.toBeNull();

    const videoSize = await page.evaluate(()=>{
        let videoElem = document.getElementById('streamingVideo') as HTMLVideoElement;
        return { width: videoElem.videoWidth, height: videoElem.videoHeight };
    });

    const coordConverter = new InputCoordTranslator();
    coordConverter.reconfigure(playerBox!, videoSize);
    const expectedActions: DataChannelEvent[] = [];
    const movements = [
        { x: 100, y: 0 },
        { x: 0, y: 100 },
        { x: -200, y: 0 },
        { x: 0, y: -200 },
    ];

    // where the pointer anchors in locked mode changes by browser
    const anchor: TranslatedCoordUnsigned = (() => {
        if (browserName == 'firefox') {
            return { x: Math.trunc(playerBox!.x + playerBox!.width / 2), y: Math.trunc(playerBox!.y + playerBox!.height / 2) };
        } else {
            return { x: Math.trunc(playerBox!.x), y: Math.trunc(playerBox!.y) };
        }
    })();

    // click on stream to activate pointer lock
    await page.mouse.click(anchor.x, anchor.y);

    let events : Record<string, DataChannelEvent[]>;

    if(browserName == 'firefox') {
        events = await getEventSetFrom(streamerPage, async () => {
            for (const movement of movements) {
                await page.mouse.move(anchor.x + movement.x, anchor.y + movement.y);
                const translated = coordConverter.translateSigned(movement.x, movement.y);
                expectedActions.push({ type: PSEventTypes.MouseMove, deltaX: Math.trunc(translated.x), deltaY: Math.trunc(translated.y) });
            }
        });
    } else {
        events = await getEventSetFrom(streamerPage, async () => {
            let mousePos = anchor;
            for (const movement of movements) {
                mousePos.x += movement.x;
                mousePos.y += movement.y;
                await page.mouse.move(mousePos.x, mousePos.y);
                const translatedDelta = coordConverter.translateSigned(movement.x, movement.y);
                expectedActions.push({ type: PSEventTypes.MouseMove, deltaX: Math.trunc(translatedDelta.x), deltaY: Math.trunc(translatedDelta.y) });
            }
        });
    }

    // check we got the expected events
    const firstPlayerId = Object.keys(events)[0];
    const singlePlayerEvents = events[firstPlayerId];
    expect(singlePlayerEvents.length === expectedActions.length, "Mouse events generated by the browser does not match our expected number of events.");
    expect(singlePlayerEvents).toContainActions(expectedActions);
});

test('Test hovering mouse movement', {
    tag: ['@mouse'],
}, async ({ page, streamerPage, streamerId }) => {

    // helps debugging
    // helpers.attachToConsoleEvents(streamerPage, (...args: any[]) => {
    //     console.log("Streamer: ", ...args);
    // });
    //
    // helpers.attachToConsoleEvents(page, (...args: any[]) => {
    //     console.log("Player: ", ...args);
    // });

    await page.goto(`/?StreamerId=${streamerId}&MatchViewportRes=true&HoveringMouse=true`);

    await helpers.startAndWaitForVideo(page);

    const playerBox = await page.locator('#videoElementParent').boundingBox();
    expect(playerBox).not.toBeNull();

    const videoSize = await page.evaluate(()=>{
        let videoElem = document.getElementById('streamingVideo') as HTMLVideoElement;
        return { width: videoElem.videoWidth, height: videoElem.videoHeight };
    });

    const anchor = { x: playerBox!.x, y: playerBox!.y };
    const coordConverter = new InputCoordTranslator();
    coordConverter.reconfigure(playerBox!, videoSize);
    const expectedActions: DataChannelEvent[] = [];
    const movements = [
        { x: anchor.x + 300, y: anchor.y + 0 },
        { x: anchor.x + 300, y: anchor.y + 200 },
        { x: anchor.x + 200, y: anchor.y + 200 },
        { x: anchor.x + 200, y: anchor.y + 100 },
    ];

    // perform the actions
    const events = await getEventSetFrom(streamerPage, async () => {
        for (const movement of movements) {
            await page.mouse.move(movement.x, movement.y);
            const translated = coordConverter.translateUnsigned(movement.x, movement.y);
            expectedActions.push({ type: PSEventTypes.MouseMove, x: Math.trunc(translated.x), y: Math.trunc(translated.y) });
        }
    });

    // check we got the expected events
    const firstPlayerId = Object.keys(events)[0];
    const singlePlayerEvents = events[firstPlayerId];
    expect(singlePlayerEvents).toContainActions(expectedActions);
});

test('Test mouse input after resizing. Hover mouse.', {
    tag: ['@mouse'],
}, async ({ page, streamerPage, streamerId }) => {

    // helps debugging
    // helpers.attachToConsoleEvents(streamerPage, (...args: any[]) => {
    //     console.log("Streamer: ", ...args);
    // });
    //
    // helpers.attachToConsoleEvents(page, (...args: any[]) => {
    //     console.log("Player: ", ...args);
    // });

    await page.goto(`/?StreamerId=${streamerId}&MatchViewportRes=true&HoveringMouse=true`);

    await helpers.startAndWaitForVideo(page);

    // resize the window to be smaller
    const oldSize = page.viewportSize();
    expect(oldSize).not.toBeNull();
    await page.setViewportSize({ width: oldSize!.width * 0.75, height: oldSize!.height * 0.5 });
    await helpers.delay(1000);

    const playerBox = await page.locator('#videoElementParent').boundingBox();
    expect(playerBox).not.toBeNull();

    const videoSize = await page.evaluate(()=>{
        let videoElem = document.getElementById('streamingVideo') as HTMLVideoElement;
        return { width: videoElem.videoWidth, height: videoElem.videoHeight };
    });

    const anchor = { x: playerBox!.x, y: playerBox!.y };
    const coordConverter = new InputCoordTranslator();
    coordConverter.reconfigure(playerBox!, videoSize);
    const expectedActions: DataChannelEvent[] = [];
    const movements = [
        { x: anchor.x + 300, y: anchor.y + 0 },
        { x: anchor.x + 300, y: anchor.y + 200 },
        { x: anchor.x + 200, y: anchor.y + 200 },
        { x: anchor.x + 200, y: anchor.y + 100 },
    ];

    // perform the actions
    const events = await getEventSetFrom(streamerPage, async () => {
        for (const movement of movements) {
            await page.mouse.move(movement.x, movement.y);
            const translated = coordConverter.translateUnsigned(movement.x, movement.y);
            expectedActions.push({ type: PSEventTypes.MouseMove, x: Math.trunc(translated.x), y: Math.trunc(translated.y) });
        }
    });

    // check we got the expected events
    const firstPlayerId = Object.keys(events)[0];
    const singlePlayerEvents = events[firstPlayerId];
    expect(singlePlayerEvents).toContainActions(expectedActions);
});

test('Test mouse input after resizing. locked mouse.', {
    tag: ['@mouse', '@locked'],
}, async ({ page, streamerPage, streamerId, browserName }) => {

    if(browserName === 'chromium') {
        // Chrome playwright is not working with pointerlock - https://github.com/microsoft/playwright/issues/20956
        // We can remove this early exit once that is fixed.
        test.skip();
    }

    // helps debugging
    // helpers.attachToConsoleEvents(streamerPage, (...args: any[]) => {
    //     console.log("Streamer: ", ...args);
    // });
    //
    // helpers.attachToConsoleEvents(page, (...args: any[]) => {
    //     console.log("Player: ", ...args);
    // });

    await page.goto(`/?StreamerId=${streamerId}&MatchViewportRes=true&HoveringMouse=false`);

    await helpers.startAndWaitForVideo(page);

    // resize the window to be smaller
    const oldSize = page.viewportSize();
    expect(oldSize).not.toBeNull();
    await page.setViewportSize({ width: oldSize!.width * 0.75, height: oldSize!.height * 0.5 });
    await helpers.delay(1000);

    const playerBox = await page.locator('#videoElementParent').boundingBox();
    expect(playerBox).not.toBeNull();

    const videoSize = await page.evaluate(()=>{
        let videoElem = document.getElementById('streamingVideo') as HTMLVideoElement;
        return { width: videoElem.videoWidth, height: videoElem.videoHeight };
    });

    const coordConverter = new InputCoordTranslator();
    coordConverter.reconfigure(playerBox!, videoSize);
    const expectedActions: DataChannelEvent[] = [];
    const movements = [
        // Note: if these values go above the dimensions of the player they might get ignored
        { x: 10, y: 0 },
        { x: 0, y: 10 },
        { x: -20, y: 0 },
        { x: 0, y: -20 },
        { x: 10, y: 10 },
    ];
    
    // where the pointer anchors in locked mode changes by browser
    const anchor: TranslatedCoordUnsigned = (() => {
        if (browserName == 'firefox') {
            return { x: playerBox!.x + playerBox!.width / 2, y: playerBox!.y + playerBox!.height / 2 };
        } else {
            return { x: playerBox!.x + playerBox!.width / 2, y: playerBox!.y + playerBox!.height / 2 };
        }
    })();

    // click on stream to activate pointer lock
    await page.click("#streamingVideo");

    let events : Record<string, DataChannelEvent[]>;

    if(browserName == 'firefox') {
        events = await getEventSetFrom(streamerPage, async () => {
            for (const movement of movements) {
                await page.mouse.move(anchor.x + movement.x, anchor.y + movement.y);
                const translated = coordConverter.translateSigned(movement.x, movement.y);
                expectedActions.push({ type: PSEventTypes.MouseMove, deltaX: Math.trunc(translated.x), deltaY: Math.trunc(translated.y) });
            }
        });
    } else {
        events = await getEventSetFrom(streamerPage, async () => {
            let mousePos = anchor;
            for (const movement of movements) {
                mousePos.x += movement.x;
                mousePos.y += movement.y;
                await page.mouse.move(mousePos.x, mousePos.y);
                const translatedDelta = coordConverter.translateSigned(movement.x, movement.y);
                expectedActions.push({ type: PSEventTypes.MouseMove, deltaX: Math.trunc(translatedDelta.x), deltaY: Math.trunc(translatedDelta.y) });
            }
        });
    }

    // check we got the expected events
    const firstPlayerId = Object.keys(events)[0];
    const singlePlayerEvents = events[firstPlayerId];
    expect(singlePlayerEvents).toContainActions(expectedActions);
});

