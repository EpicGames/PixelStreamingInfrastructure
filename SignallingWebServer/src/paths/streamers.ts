// Copyright Epic Games, Inc. All Rights Reserved.
import { SignallingServer } from '@epicgames-ps/lib-pixelstreamingsignalling-ue5.8';

/* eslint-disable @typescript-eslint/no-unsafe-call,
                  @typescript-eslint/no-unsafe-member-access */

export default function (signallingServer: SignallingServer) {
    const operations = {
        GET
    };

    function GET(req: any, res: any, _next: any) {
        res.status(200).json(
            signallingServer.streamerRegistry.streamers.map((streamer) => streamer.getStreamerInfo())
        );
    }

    GET.apiDoc = {
        summary: 'Returns list of streamers',
        operationId: 'getStreamers',
        responses: {
            200: {
                description: 'List of streamers',
                content: {
                    'application/json': {
                        schema: {
                            type: 'array',
                            items: {
                                type: 'string'
                            }
                        }
                    }
                }
            }
        }
    };

    return operations;
}
