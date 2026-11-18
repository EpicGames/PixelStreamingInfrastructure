// Copyright Epic Games, Inc. All Rights Reserved.
import { SignallingServer } from '@epicgames-ps/lib-pixelstreamingsignalling-ue5.8';
import { publicConfigView } from '../publicConfig';

/* eslint-disable @typescript-eslint/no-unsafe-call,
                  @typescript-eslint/no-unsafe-member-access */

export default function (signallingServer: SignallingServer) {
    const operations = {
        GET
    };

    function GET(req: any, res: any, _next: any) {
        // Not the config objects themselves: those hold the HTTP servers, the WebSocket options and
        // the peer options with any static TURN credential in them.
        res.status(200).json(publicConfigView(signallingServer.config, signallingServer.protocolConfig));
    }

    GET.apiDoc = {
        summary: 'Returns the current configuration of the server. ICE server credentials are redacted.',
        operationId: 'getConfig',
        responses: {
            200: {
                description: 'The current configuration of the server.',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                config: {
                                    type: 'object'
                                },
                                protocolConfig: {
                                    type: 'object'
                                }
                            }
                        }
                    }
                }
            }
        }
    };

    return operations;
}
