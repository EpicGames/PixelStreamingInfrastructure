// Copyright Epic Games, Inc. All Rights Reserved.
import { IServerConfig, Logger } from '@epicgames-ps/lib-pixelstreamingsignalling-ue5.8';
import { configureListenHosts } from './listenHosts';

// As in streamerAuth.test.ts: the module logs through the Signalling library's Logger, which is
// replaced here so the suite does not depend on a built Signalling/dist.
jest.mock(
    '@epicgames-ps/lib-pixelstreamingsignalling-ue5.8',
    () => ({ Logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() } }),
    { virtual: true }
);

function serverOptions(): IServerConfig {
    return { streamerPort: 8888, playerPort: 80, sfuPort: 8889, peerOptions: {} };
}

describe('listen hosts', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('leaves every listener on every address when no host is given', () => {
        const serverOpts = serverOptions();
        configureListenHosts({ streamer_host: '', sfu_host: '' }, serverOpts);

        expect(serverOpts.streamerWsOptions).toBeUndefined();
        expect(serverOpts.sfuWsOptions).toBeUndefined();
        expect(serverOpts.playerWsOptions).toBeUndefined();
    });

    it('binds the streamer listener to --streamer_host', () => {
        const serverOpts = serverOptions();
        configureListenHosts({ streamer_host: '127.0.0.1' }, serverOpts);

        expect(serverOpts.streamerWsOptions?.host).toBe('127.0.0.1');
        expect(serverOpts.sfuWsOptions).toBeUndefined();
        expect(serverOpts.playerWsOptions).toBeUndefined();
    });

    it('binds the SFU listener to --sfu_host', () => {
        const serverOpts = serverOptions();
        configureListenHosts({ sfu_host: '10.0.0.5' }, serverOpts);

        expect(serverOpts.sfuWsOptions?.host).toBe('10.0.0.5');
        expect(serverOpts.streamerWsOptions).toBeUndefined();
        expect(serverOpts.playerWsOptions).toBeUndefined();
    });

    it('keeps the options already set on a listener, such as the streamer token check', () => {
        const verifyClient = jest.fn();
        const serverOpts: IServerConfig = { ...serverOptions(), streamerWsOptions: { verifyClient } };
        configureListenHosts({ streamer_host: '::1' }, serverOpts);

        expect(serverOpts.streamerWsOptions).toEqual({ verifyClient, host: '::1' });
    });

    it('refuses to start with a host that is not text', () => {
        const serverOpts = serverOptions();

        expect(() => configureListenHosts({ sfu_host: true }, serverOpts)).toThrow('Invalid sfu_host.');
        expect(Logger.error).toHaveBeenCalledWith(expect.stringContaining('sfu_host'));
        expect(serverOpts.sfuWsOptions).toBeUndefined();
    });
});
