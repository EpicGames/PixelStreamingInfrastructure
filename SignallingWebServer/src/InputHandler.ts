import { SignallingServer } from '@epicgames-ps/lib-signalling';
import { IProgramOptions, beautify } from './Utils';

interface IHandlerFunc {
    desc: string,
    func: (options: IProgramOptions, signallingServer: SignallingServer) => void,
}

export function initInputHandler(options: IProgramOptions, signallingServer: SignallingServer) {
    const stdin = process.stdin;

    stdin.setRawMode( true );
    stdin.resume();
    stdin.setEncoding('utf8');

    const handlers: Record<string, IHandlerFunc> = {
        'c': { desc: 'Print configuration.', func: printConfig },
        'i': { desc: 'Print current server info.', func: printServerInfo },
        's': { desc: 'Print list of connected streamers.', func: printStreamerList },
        'p': { desc: 'Print list of connected players.', func: printPlayerList },
    }

    // on any data into stdin
    stdin.on('data', (keyBuffer) => {
        const key = keyBuffer.toString();
        if (key == 'q' || key == '\u0003') {
            process.exit();
        } else if (key == 'h') {
            process.stdout.write('Help:\n');
            for (const [handlerKey, handlerInfo] of Object.entries(handlers)) {
                process.stdout.write(`\t${handlerKey} - ${handlerInfo.desc}\n`);
            }
            process.stdout.write(`\th - Help.\n`);
            process.stdout.write(`\tq - Quit.\n`);
        } else {
            const handler = handlers[key];
            if (!handler) {
                process.stdout.write(`${key}: No handler.\n`);
            } else {
                handler.func(options, signallingServer);
            }
        }
    });
}

function printConfig(options: IProgramOptions) {
    process.stdout.write(`${beautify(options)}\n`);
}

function printServerInfo(_options: IProgramOptions, _signallingServer: SignallingServer) {
    process.stdout.write(`Info:\n\t<TODO input times/counts/errors etc>\n`);
}

function printStreamerList(_options: IProgramOptions, signallingServer: SignallingServer) {
    process.stdout.write(`Streamer Ids: ${signallingServer.streamerRegistry.streamers.map(streamer => streamer.streamerId)}\n`);
}

function printPlayerList(_options: IProgramOptions, signallingServer: SignallingServer) {
    process.stdout.write(`Player Ids: ${signallingServer.playerRegistry.listPlayers().map(player => player.playerId)}\n`);
}
