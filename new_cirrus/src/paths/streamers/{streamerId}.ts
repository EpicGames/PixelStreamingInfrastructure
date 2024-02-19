import { SignallingServer } from '../../SignallingServer';

export default function (signallingServer: SignallingServer) {
    let operations = {
        GET,
    };

    function GET(req: any, res: any, next: any) {
        const streamer = signallingServer.streamerRegistry.find(req.params.streamerId);
        if (!streamer) {
            throw new Error(`No streamer id matches ${req.params.streamerId}.`);
        }
        res.status(200).json(streamer.getStreamerInfo());
    }

    GET.apiDoc = {
        summary: "Returns a single streamer",
        operationId: "getOneStreamer",
        parameters: [
            {
                name: "streamerId",
                in: "path",
                required: true,
                schema: {
                    type: "string",
                },
            },
        ],
        responses: {
            200: {
                description: "Streamer data",
                content: {
                    "application/json": {
                        schema: {
                            $ref: "#/components/schemas/Streamer",
                        },
                    },
                },
            },
        },
    };

    return operations;
}
