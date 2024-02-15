import express from 'express';
import * as http from 'http';
import { SignallingServer, IServerConfig } from './SignallingServer';
import { WebServer } from './WebServer';
import { InitLogging, Logger } from './Logger';
import { Command, Option } from 'commander';

const program = new Command();
program
    .description("Cirrus 2 - Electric boogaloo.\nThe new hotness in pixel streaming signalling")
    .version("9000.1");

program
    .option('--log_folder <path>', 'Sets the path for the log files.', 'logs')
    .addOption(new Option('--log_level_console <level>', 'Sets the logging level for console messages.')
        .choices(["debug","info","warning","error"])
        .default("warning"))
    .addOption(new Option('--log_level_file <level>', 'Sets the logging level for log files.')
        .choices(["debug","info","warning","error"])
        .default("info"))
    .addOption(new Option('--console_messages [detail]', 'Displays incoming and outgoing signalling messages on the console.')
        .choices(["basic","verbose","formatted"])
        .preset("basic"))
    .option('--streamer_port <port>', 'Sets the listening port for streamer connections.', '8888')
    .option('--player_port <port>', 'Sets the listening port for player connections.', '80')
    .option('--sfu_port <port>', 'Sets the listening port for SFU connections.', '8889')
    .addOption(new Option('--serve', 'Enables the webserver on player_port.'))
    .option('--http_root <path>', 'Sets the path for the webserver root.', 'www')
    .option('--homepage <filename>', 'The default html file to serve on the web server.', 'player.html')
    .addOption(new Option('--client_config <json-string>', 'Additional JSON data to send to connecting peers.')
        .argParser(JSON.parse))
    .helpOption('-h, --help', 'Display this help text.')
    .parse();

const options = program.opts();

InitLogging({
    logDir: options.log_folder,
    logMessagesToConsole: options.console_messages,
    logLevelConsole: options.log_level_console,
    logLevelFile: options.log_level_file,
});

const app = express();

const serverOpts: IServerConfig = {
    streamerPort: options.streamer_port,
    playerPort: options.player_port,
    sfuPort: options.sfu_port,
    clientConfig: options.client_config
}

if (options.serve) {
    const server = http.createServer(app);
    const webServer = new WebServer(app, server, {
        port: options.player_port,
        root: options.http_root,
        homepageFile: options.homepage
    });
    serverOpts.httpServer = server;
}

const signallingServer = new SignallingServer(serverOpts);
