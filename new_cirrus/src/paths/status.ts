import { SignallingServer } from '../SignallingServer';

export default function(signallingServer: SignallingServer) {
    let operations = {
        GET,
    };

    function GET(req: any, res: any, next: any) {
        const nowTime = new Date();
        const uptime = nowTime.getTime() - signallingServer.startTime.getTime();
        res.status(200).json({
            uptime: uptime,
            streamer_count: signallingServer.streamerRegistry.count(),
            player_count: signallingServer.playerRegistry.count(),
        });
    }

    GET.apiDoc = {
        summary: "Returns the current status of the server.",
        operationId: "getConfig",
        responses: {
            200: {
                description: "The current status of the server.",
                content: {
                    "application/json": {
                       schema: {
                            type: "object",
                            properties: {
                                "uptime": {
                                    type: "number"
                                },
                                "streamer_count": {
                                    type: "number"
                                },
                                "player_count": {
                                    type: "number"
                                },
                            },
                        },
                    },
                },
            },
        },
    };

    return operations;
}
