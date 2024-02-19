import { SignallingServer } from '../SignallingServer';

export default function(signallingServer: SignallingServer) {
    let operations = {
        GET,
    };

    function GET(req: any, res: any, next: any) {
        res.status(200).json(signallingServer.playerRegistry.listPlayers().map(player => player.playerId));
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
