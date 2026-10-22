import { expect, Page } from '@playwright/test';
import type { Streamer } from '@epicgames-ps/js-streamer';
import { test } from './fixtures';
import { startAndWaitForVideo } from './helpers';

type PlayerPeer = NonNullable<ReturnType<Streamer['playerMap']['get']>>;

async function observePeers(streamerPage: Page) {
    return streamerPage.evaluateHandle(() => {
        const peers: PlayerPeer[] = [];
        const clearedTimers: number[] = [];
        const disconnectedPlayers: string[] = [];
        const transportCloses: { code: number; reason: string }[] = [];
        const tracks = window.streamer.localStream.getTracks();
        const clearInterval = window.clearInterval.bind(window);
        window.clearInterval = (timer) => {
            if (timer !== undefined) {
                clearedTimers.push(timer);
            }
            clearInterval(timer);
        };
        window.streamer.on('player_connected', (peer: PlayerPeer) => peers.push(peer));
        window.streamer.on('player_disconnected', (playerId: string) => disconnectedPlayers.push(playerId));
        window.streamer.transport.on('close', (event: CloseEvent) => {
            transportCloses.push({ code: event.code, reason: event.reason });
        });
        return { peers, clearedTimers, disconnectedPlayers, transportCloses, tracks };
    });
}

test('Stopping the streamer closes all peers and clears their stats timers', async ({
    page,
    context,
    streamerPage,
    streamerId
}) => {
    const observed = await observePeers(streamerPage);
    await page.goto(`/?StreamerId=${streamerId}`);
    await startAndWaitForVideo(page);
    const secondPlayer = await context.newPage();
    await secondPlayer.goto(`/?StreamerId=${streamerId}`);
    await startAndWaitForVideo(secondPlayer);

    await expect
        .poll(() =>
            streamerPage.evaluate(({ peers }) => peers.map((peer) => peer.dataChannel.readyState), observed)
        )
        .toEqual(['open', 'open']);
    await expect
        .poll(() =>
            streamerPage.evaluate(
                ({ peers }) => peers.every((peer) => peer.lastStatsTime !== undefined),
                observed
            )
        )
        .toBe(true);

    const messages = await page.evaluateHandle(() => {
        const received: { type: number; body: unknown }[] = [];
        window.pixelStreaming.webRtcController.sendrecvDataChannelController.dataChannel.addEventListener(
            'message',
            (event: MessageEvent<ArrayBuffer>) => {
                const bytes = new Uint8Array(event.data);
                if (bytes[0] === 255 || bytes[0] === 7) {
                    received.push({
                        type: bytes[0],
                        body: JSON.parse(new TextDecoder('utf-16le').decode(bytes.subarray(1)))
                    });
                }
            }
        );
        return received;
    });
    const settings = await streamerPage.evaluate(({ peers }) => {
        window.streamer.sendDataProtocol(peers[0].id);
        window.streamer.sendInitialSettings(peers[0].id);
        return window.streamer.settings;
    }, observed);
    await expect
        .poll(() => page.evaluate((received) => received, messages))
        .toEqual([
            {
                type: 255,
                body: expect.objectContaining({
                    Direction: 0,
                    RequestQualityControl: { id: 1, structure: [] }
                })
            },
            { type: 255, body: expect.objectContaining({ Direction: 1 }) },
            { type: 7, body: settings }
        ]);

    await streamerPage.evaluate(() => window.streamer.stopStreaming());
    const snapshot = () =>
        streamerPage.evaluate(
            ({ peers, clearedTimers }) => ({
                connections: peers.map((peer) => peer.peerConnection.connectionState),
                timerClearCounts: peers.map(
                    (peer) => clearedTimers.filter((timer) => timer === peer.statsTimer).length
                ),
                trackedPeers: window.streamer.playerMap.size
            }),
            observed
        );
    expect(await snapshot()).toEqual({
        connections: ['closed', 'closed'],
        timerClearCounts: [1, 1],
        trackedPeers: 0
    });
    expect(
        await streamerPage.evaluate(
            ({ disconnectedPlayers, tracks }) => ({
                disconnectedPlayers,
                hasTracks: tracks.length > 0,
                tracksLive: tracks.every((track) => track.readyState === 'live')
            }),
            observed
        )
    ).toEqual({ disconnectedPlayers: [], hasTracks: true, tracksLive: true });
    await expect
        .poll(() => streamerPage.evaluate(({ transportCloses }) => transportCloses, observed))
        .toEqual([{ code: 1000, reason: 'Normal shutdown by calling stopStreaming' }]);

    await streamerPage.evaluate(() => window.streamer.stopStreaming());
    expect(await snapshot()).toEqual({
        connections: ['closed', 'closed'],
        timerClearCounts: [1, 1],
        trackedPeers: 0
    });
});

test('Disconnecting a player cleans up only that peer before streamer shutdown', async ({
    page,
    context,
    streamerPage,
    streamerId
}) => {
    const observed = await observePeers(streamerPage);
    await page.goto(`/?StreamerId=${streamerId}`);
    await startAndWaitForVideo(page);
    const secondPlayer = await context.newPage();
    await secondPlayer.goto(`/?StreamerId=${streamerId}`);
    await startAndWaitForVideo(secondPlayer);
    await expect
        .poll(() =>
            streamerPage.evaluate(({ peers }) => peers.map((peer) => peer.dataChannel.readyState), observed)
        )
        .toEqual(['open', 'open']);

    await page.close();
    const snapshot = () =>
        streamerPage.evaluate(
            ({ peers, clearedTimers }) => ({
                connections: peers.map((peer) => peer.peerConnection.connectionState),
                timerClearCounts: peers.map(
                    (peer) => clearedTimers.filter((timer) => timer === peer.statsTimer).length
                ),
                trackedPeers: window.streamer.playerMap.size
            }),
            observed
        );
    await expect.poll(snapshot).toEqual({
        connections: ['closed', 'connected'],
        timerClearCounts: [1, 0],
        trackedPeers: 1
    });

    await streamerPage.evaluate(({ peers }) => {
        for (const playerId of [peers[0].id, 'unknown-player']) {
            window.streamer.handlePlayerDisconnectedMessage({ type: 'playerDisconnected', playerId });
        }
    }, observed);
    expect(await snapshot()).toEqual({
        connections: ['closed', 'connected'],
        timerClearCounts: [1, 0],
        trackedPeers: 1
    });
    const disconnects = await streamerPage.evaluate(
        ({ peers, disconnectedPlayers }) => ({
            actual: disconnectedPlayers,
            expected: [peers[0].id, peers[0].id, 'unknown-player']
        }),
        observed
    );
    expect(disconnects.actual).toEqual(disconnects.expected);

    await streamerPage.evaluate(() => window.streamer.stopStreaming());
    expect(await snapshot()).toEqual({
        connections: ['closed', 'closed'],
        timerClearCounts: [1, 1],
        trackedPeers: 0
    });
});

test('Stopping an idle streamer is safe to repeat', async ({ streamerPage }) => {
    expect(
        await streamerPage.evaluate(() => {
            window.streamer.stopStreaming();
            window.streamer.stopStreaming();
            return window.streamer.playerMap.size;
        })
    ).toBe(0);
});
