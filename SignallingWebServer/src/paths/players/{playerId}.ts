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
        const player = signallingServer.playerRegistry.get(req.params.playerId);
        if (!player) {
            res.status(404).json({ message: `No player ID matches ${req.params.playerId}.` });
            return;
        }
        res.status(200).json(player.getPlayerInfo());
    }

    GET.apiDoc = {
        summary: 'Returns a single player',
        operationId: 'getOnePlayer',
        parameters: [
            {
                name: 'playerId',
                in: 'path',
                required: true,
                schema: {
                    type: 'string'
                }
            }
        ],
        responses: {
            200: {
                description: 'Player data',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/Player'
                        }
                    }
                }
            }
        }
    };

    return operations;
}
