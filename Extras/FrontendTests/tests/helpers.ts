import { Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

const __dirname = path.dirname(__filename);
const __resultsDirectory = path.join(__dirname, '../results');
const __screenshotDirectory = path.join(__dirname, '../results/screenshots');

if (!fs.existsSync(__resultsDirectory)) {
 fs.mkdirSync(__resultsDirectory, { recursive: true });
}

if (!fs.existsSync(__screenshotDirectory)) {
 fs.mkdirSync(__screenshotDirectory, { recursive: true });
}

export function getResultsDirectory() {
   return __resultsDirectory;
}

export async function takeScreenshot(page: Page, fileName: string) {
   await page.screenshot({
       path: path.join(__screenshotDirectory, fileName),
       fullPage: false
   });
}

export function delay(time: number) {
  return new Promise(function(resolve) { 
    setTimeout(resolve, time)
  });
}

// Browsers warp the cursor when pointer lock engages, and where they warp to differs between
// browsers and between versions of the same browser (Firefox 155 changed it). That makes the
// delta on the first move after locking unpredictable. Moving to a known point absorbs it, so
// call this after the click that locks the pointer and before capturing any events.
export async function settleLockedPointer(page: Page, anchor: { x: number, y: number }) {
    await page.mouse.move(anchor.x, anchor.y);
    await delay(50);
}


export async function startAndWaitForVideo(page: Page) {
    await page.evaluate(()=> {
        return new Promise((resolve) => {
            // Note: Assign listener before we start the connection
            window.pixelStreaming.addEventListener('playStream', (event) => {
                return resolve(event);
            });
            // Make the actual connection initiation
            window.pixelStreaming.connect();
        });
    });
}

export async function getStreamStats(page: Page) {
    const stats = await page.evaluate(() => {
        return window.pixelStreaming.webRtcController.peerConnectionController.aggregatedStats;
    });
    return stats;
}

export async function sendSignallingMessage(page: Page, message: any) {
    await page.evaluate((message)=> {
        window.pixelStreaming.signallingProtocol.sendMessage(message);
    }, message);
}

export function attachToConsoleEvents(page: Page, callback: (...args: any[]) => void) {
    page.on('console', async msg => {
        const values: any[] = [];
        for (const arg of msg.args())
            values.push(await arg.jsonValue());
        callback(...values);
    });
}

export interface BoxSize {
    width: number;
    height: number;
};

export interface Coord {
    x: number;
    y: number;
};

export class CoordConverter {
    playerSize: BoxSize;
    videoSize: BoxSize;
    ratio: number;
    playerIsLarger: boolean;

    constructor(playerSize: BoxSize, videoSize: BoxSize) {
        this.playerSize = playerSize;
        this.videoSize = videoSize;
        const playerAspectRatio = this.playerSize.height / this.playerSize.width;
        const videoAspectRatio = this.videoSize.height / this.videoSize.width;
        this.playerIsLarger = playerAspectRatio > videoAspectRatio;
        if (this.playerIsLarger) {
            this.ratio = playerAspectRatio / videoAspectRatio;
        } else {
            this.ratio = videoAspectRatio / playerAspectRatio;
        }
    }

    public normalizeQuantizeSigned(x: number, y: number): Coord {
        if (this.playerIsLarger) {
            const normalizedX = x / (0.5 * this.playerSize.width);
            const normalizedY = (this.ratio * y) / (0.5 * this.playerSize.height);
            return {
                x: Math.trunc(normalizedX * 32767),
                y: Math.trunc(normalizedY * 32767)
            };
        } else {
            const normalizedX = (this.ratio * x) / (0.5 * this.playerSize.width);
            const normalizedY = y / (0.5 * this.playerSize.height);
            return {
                x: Math.trunc(normalizedX * 32767),
                y: Math.trunc(normalizedY * 32767)
            };
        }
    }
    public normalizeQuantizeUnsigned(x: number, y: number): Coord {
        if (this.playerIsLarger) {
            const normalizedX = x / this.playerSize.width;
            const normalizedY = this.ratio * (y / this.playerSize.height - 0.5) + 0.5;
            return {
                x: Math.trunc(normalizedX * 65536),
                y: Math.trunc(normalizedY * 65536)
            };
        } else {
            const normalizedX = this.ratio * (x / this.playerSize.width - 0.5) + 0.5;
            const normalizedY = y / this.playerSize.height;
            return {
                x: Math.trunc(normalizedX * 65536),
                y: Math.trunc(normalizedY * 65536)
            };
        }
    }
};

