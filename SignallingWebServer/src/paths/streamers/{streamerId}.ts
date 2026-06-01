// Copyright Epic Games, Inc. All Rights Reserved.
import { SignallingServer } from '@epicgames-ps/lib-pixelstreamingsignalling-ue5.8';

/* eslint-disable @typescript-eslint/no-unsafe-argument,
                  @typescript-eslint/no-unsafe-call,
                  @typescript-eslint/no-unsafe-member-access */

export default function (signallingServer: SignallingServer) {
    const operations = {
        GET
    };

    function GET(req: any, res: any, _next: any) {
        const streamer = signallingServer.streamerRegistry.find(req.params.streamerId);
        if (!streamer) {
            res.status(404).json({ message: `No streamer id matches ${req.params.streamerId}.` });
            return;
        }
        res.status(200).json(streamer.getStreamerInfo());
    }

    GET.apiDoc = {
        summary: 'Returns a single streamer',
        operationId: 'getOneStreamer',
        parameters: [
            {
                name: 'streamerId',
                in: 'path',
                required: true,
                schema: {
                    type: 'string'
                }
            }
        ],
        responses: {
            200: {
                description: 'Streamer data',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/Streamer'
                        }
                    }
                }
            }
        }
    };

    return operations;
}
