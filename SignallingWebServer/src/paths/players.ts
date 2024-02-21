import { SignallingServer } from '@epicgames-ps/lib-pixelstreamingsignalling-ue5.5';

export default function(signallingServer: SignallingServer) {
    const operations = {
        GET,
    };

    function GET(req: any, res: any, _next: any) {
        res.status(200).json(signallingServer.playerRegistry.listPlayers().map(player => player.getPlayerInfo()));
    }

    GET.apiDoc = {
        summary: "Returns list of players",
        operationId: "getPlayers",
        responses: {
            200: {
                description: "List of player IDs",
                content: {
                    "application/json": {
                       schema: {
                            type: "array",
                            items: {
                                type: "string",
                            },
                        },
                    },
                },
            },
        },
    };

    return operations;
}
