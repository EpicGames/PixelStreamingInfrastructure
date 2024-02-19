import { SignallingServer } from '../../SignallingServer';

export default function (signallingServer: SignallingServer) {
    let operations = {
        GET,
    };

    function GET(req: any, res: any, next: any) {
        const player = signallingServer.playerRegistry.get(req.params.playerId);
        if (!player) {
            throw new Error(`No player ID matches ${req.params.playerId}.`);
        }
        res.status(200).json(player.getPlayerInfo());
    }

    GET.apiDoc = {
        summary: "Returns a single player",
        operationId: "getOnePlayer",
        parameters: [
            {
                name: "playerId",
                in: "path",
                required: true,
                schema: {
                    type: "string",
                },
            },
        ],
        responses: {
            200: {
                description: "Player data",
                content: {
                    "application/json": {
                        schema: {
                            $ref: "#/components/schemas/Player",
                        },
                    },
                },
            },
        },
    };

    return operations;
}
