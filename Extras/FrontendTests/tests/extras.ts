import { Page } from 'playwright';
import { Streamer, DataProtocol } from '@epicgames-ps/js-streamer';
import { delay } from './helpers';
import { PixelStreaming, WebRtcSdpAnswerEvent } from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.8';

declare global {
    interface Window {
        pixelStreaming: PixelStreaming;
        streamer: Streamer;
        signallingURL?: string;
        dataMessages: Record<string,DataChannelEvent[]>;
        dataMessageListener(playerId: number, message: any): void;
    }
}

export enum PSEventTypes {
    MouseDown = DataProtocol.ToStreamer.MouseDown.id,
    MouseUp = DataProtocol.ToStreamer.MouseUp.id,
    MouseMove = DataProtocol.ToStreamer.MouseMove.id,
    MouseWheel = DataProtocol.ToStreamer.MouseWheel.id,
    MouseDouble = DataProtocol.ToStreamer.MouseDouble.id,
    MouseEnter = DataProtocol.ToStreamer.MouseEnter.id,
    MouseLeave = DataProtocol.ToStreamer.MouseLeave.id,
    KeyDown = DataProtocol.ToStreamer.KeyDown.id,
    KeyUp = DataProtocol.ToStreamer.KeyUp.id,
    KeyPress = DataProtocol.ToStreamer.KeyPress.id,
    Command = DataProtocol.ToStreamer.Command.id,
};

type NumberValidator = (n: number) => boolean;

// mouse input events captured by the streamer
export interface DataChannelMouseInput {
    type: number;
    button?: number;
    x?: number | NumberValidator;
    y?: number | NumberValidator;
    deltaX?: number | NumberValidator;
    deltaY?: number | NumberValidator;
    delta?: number | NumberValidator;
};

// keyboard input events captured by the streamer
export interface DataChannelKeyboardInput {
    type: number;
    keyCode: number;
};

export interface DataChannelCommandInput {
    type: number;
    command: string;
};

// a generic type for inputs captured by the streamer
export type DataChannelEvent = DataChannelMouseInput | DataChannelKeyboardInput | DataChannelCommandInput;

// sets up the streamer page to capture data channel messages
// will capture events in a map on the window keyed by player id
export function setupEventCapture(streamerPage: Page) {
    return streamerPage.evaluate(() => {
        window.dataMessages = {};
        window.dataMessageListener = (playerId, message) => {
            if (window.dataMessages[playerId] == undefined) {
                window.dataMessages[playerId] = [];
            }
            window.dataMessages[playerId].push({ type: message.type, ...message.message });
        };
        window.streamer.on('data_channel_message', window.dataMessageListener);
    });
}

// turns off the data channel capturing on the streamer page
export function teardownEventCapture(streamerPage: Page) {
    return streamerPage.evaluate(() => {
        window.streamer.off('data_channel_message', window.dataMessageListener);
    });
}

// gets all the captured data channel messages between setup/teardownEventCapture
export function getCapturedEvents(streamerPage: Page): Promise<Record<string, DataChannelEvent[]>> {
    return streamerPage.evaluate(() => {
        return window.dataMessages;
    });
}

// gets the SDP answer from the player page
export function getSdpAnswer(playerPage: Page): Promise<RTCSessionDescriptionInit> {
    return playerPage.evaluate(() => {
        return new Promise<RTCSessionDescriptionInit>((resolve) => {
            window.pixelStreaming.addEventListener("webRtcSdpAnswer", (evt : WebRtcSdpAnswerEvent) => {
                resolve(evt.data.sdp);
            });
        });
    });
}

export async function getEventSetFrom(streamerPage: Page, performAction: () => Promise<void>): Promise<Record<string, DataChannelEvent[]>> {
    await setupEventCapture(streamerPage);
    await performAction();
    await delay(5); // just give a little time for the events to come through
    await teardownEventCapture(streamerPage);
    return await getCapturedEvents(streamerPage);
}

export function getEvents(eventSet: Record<string, DataChannelEvent[]>, playerId?: string): DataChannelEvent[] {
    playerId = playerId || Object.keys(eventSet)[0];
    return eventSet[playerId];
}

