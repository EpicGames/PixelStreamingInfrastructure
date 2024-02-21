import { SignallingServer } from '@epicgames-ps/lib-signalling';

/* eslint-disable  @typescript-eslint/no-var-requires */
const pjson = require('../../package.json');
/* eslint-enable  @typescript-eslint/no-var-requires */

export default function(signallingServer: SignallingServer) {
    const operations = {
        GET,
    };

    function GET(req: any, res: any, _next: any) {
        const nowTime = new Date();
        const uptime = nowTime.getTime() - signallingServer.startTime.getTime();
        res.status(200).json({
            uptime: uptime,
            streamer_count: signallingServer.streamerRegistry.count(),
            player_count: signallingServer.playerRegistry.count(),
            version: pjson.version,
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
                                "version": {
                                    type: "string"
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
