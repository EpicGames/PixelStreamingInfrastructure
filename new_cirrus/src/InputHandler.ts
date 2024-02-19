import { SignallingServer, IServerConfig } from './SignallingServer';
import { stringify, beautify } from './Utils';

export function initInputHandler(options: unknown, signallingServer: SignallingServer) {
    var stdin = process.stdin;

    stdin.setRawMode( true );
    stdin.resume();
    stdin.setEncoding('utf8');

    const handlers: Record<string, any> = {
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

function printConfig(options: unknown) {
	process.stdout.write(`${beautify(options)}\n`);
}

function printServerInfo(options: unknown, signallingServer: SignallingServer) {
	process.stdout.write(`Info:\n\t<TODO input times/counts/errors etc>\n`);
}

function printStreamerList(options: unknown, signallingServer: SignallingServer) {
	process.stdout.write(`Streamer Ids: ${signallingServer.streamerRegistry.streamers.map(streamer => streamer.streamerId)}\n`);
}

function printPlayerList(soptions: unknown, signallingServer: SignallingServer) {
	process.stdout.write(`Player Ids: ${signallingServer.playerRegistry.listPlayers().map(player => player.playerId)}\n`);
}
