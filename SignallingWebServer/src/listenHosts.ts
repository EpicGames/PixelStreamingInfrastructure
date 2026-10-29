// Copyright Epic Games, Inc. All Rights Reserved.
import type { IServerConfig } from '@epicgames-ps/lib-pixelstreamingsignalling-ue5.8';
import { Logger } from '@epicgames-ps/lib-pixelstreamingsignalling-ue5.8';
import { IProgramOptions } from './Utils';

function readHost(value: unknown, name: string): string {
    if (value === undefined || value === null || value === '') return '';
    if (typeof value !== 'string') {
        // Refused rather than ignored: whoever wrote this meant to narrow the listener, and ignoring
        // it would leave the port on every address without a word. Logged before the throw, which
        // beats winston's flush.
        Logger.error(`${name} is not an address; it must be text such as "127.0.0.1".`);
        throw Error(`Invalid ${name}.`);
    }
    return value;
}

/**
 * Binds the streamer and SFU listeners to the addresses given by --streamer_host and --sfu_host,
 * keeping any other options already set on them. A listener without one listens on every address.
 */
export function configureListenHosts(options: IProgramOptions, serverOptions: IServerConfig): void {
    const streamerHost = readHost(options.streamer_host, 'streamer_host');
    if (streamerHost) {
        serverOptions.streamerWsOptions = { ...serverOptions.streamerWsOptions, host: streamerHost };
        Logger.info(`Streamer connections are accepted on ${streamerHost} only.`);
    }

    const sfuHost = readHost(options.sfu_host, 'sfu_host');
    if (sfuHost) {
        serverOptions.sfuWsOptions = { ...serverOptions.sfuWsOptions, host: sfuHost };
        Logger.info(`SFU connections are accepted on ${sfuHost} only.`);
    }
}
