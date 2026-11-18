// Copyright Epic Games, Inc. All Rights Reserved.
import type { IServerConfig, ProtocolConfig } from '@epicgames-ps/lib-pixelstreamingsignalling-ue5.7';

/** The fields of an ICE server entry that authenticate to it, and so never leave the server here. */
const ICE_SECRET_FIELDS = ['username', 'credential'];

/** Placeholder for a secret that is configured but not returned. */
export const REDACTED = '<redacted>';

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Returns a copy of peer options with every ICE server's username and credential replaced by a
 * placeholder. A field that was configured stays visible as configured, which is what someone
 * diagnosing a TURN problem needs to know; its value never is. Everything else is copied as is.
 */
export function redactPeerOptions(peerOptions: unknown): unknown {
    if (!isRecord(peerOptions) || !Array.isArray(peerOptions.iceServers)) return peerOptions;

    return {
        ...peerOptions,
        iceServers: peerOptions.iceServers.map((server: unknown) => {
            if (!isRecord(server)) return server;
            const copy = { ...server };
            for (const field of ICE_SECRET_FIELDS) {
                if (copy[field] !== undefined && copy[field] !== '') copy[field] = REDACTED;
            }
            return copy;
        })
    };
}

/**
 * Builds the body of `GET /api/config`.
 *
 * The server config is listed field by field rather than copied and trimmed. It holds the HTTP
 * servers, the WebSocket options with any consumer verifyClient, and hooks such as the TURN
 * credentials provider, and any field added to IServerConfig later would otherwise be published the
 * day it was added. The peer options appear in both halves, so both are redacted.
 */
export function publicConfigView(
    config: IServerConfig,
    protocolConfig: ProtocolConfig
): { config: Record<string, unknown>; protocolConfig: Record<string, unknown> } {
    return {
        config: {
            streamerPort: config.streamerPort,
            playerPort: config.playerPort,
            sfuPort: config.sfuPort,
            maxSubscribers: config.maxSubscribers,
            playerKeepaliveTimeout: config.playerKeepaliveTimeout,
            peerOptions: redactPeerOptions(config.peerOptions)
        },
        protocolConfig: {
            protocolVersion: protocolConfig.protocolVersion,
            peerConnectionOptions: redactPeerOptions(protocolConfig.peerConnectionOptions)
        }
    };
}
