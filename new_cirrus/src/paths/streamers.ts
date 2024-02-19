import { SignallingServer } from '../SignallingServer';

export default function(signallingServer: SignallingServer) {
    let operations = {
        GET,
    };

    function GET(req: any, res: any, next: any) {
        res.status(200).json(signallingServer.streamerRegistry.getStreamerIds());
    }

    GET.apiDoc = {
        summary: "Returns list of streamers",
        operationId: "getStreamers",
        responses: {
            200: {
                description: "List of streamers",
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
