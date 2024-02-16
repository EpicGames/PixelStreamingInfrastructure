import express from 'express';
import * as http from 'http';
import { SignallingServer, IServerConfig } from './SignallingServer';
import { WebServer } from './WebServer';
import { InitLogging, Logger } from './Logger';
import { Command, Option } from 'commander';
import { initInputHandler } from './InputHandler';
import { stringify, beautify } from './Utils';

const fs = require("fs");
const pjson = require('../package.json');

// read any config file
let config_file: any = {};
try {
    let configData = fs.readFileSync('config_file.json', 'UTF8');
    config_file = JSON.parse(configData);
} catch(error) {
    console.log(error);
}

const program = new Command();
program
    .name(pjson.name)
    .description(pjson.description)
    .version(pjson.version);

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
    .option('--homepage <filename>', 'The default html file to serve on the web server.', 'index.html')
    .addOption(new Option('--peer_options <json-string>', 'Additional JSON data to send in peerConnectionOptions of the config message.')
        .argParser(JSON.parse))
    .option('--log_config', 'Will print the program configuration on startup.')
    .option('--stdin', 'Allows stdin input while running.')
    .option('--no_save', 'On startup the given configuration is resaved out to config.json. This switch will prevent this behaviour allowing the config.json file to remain untouched while running with new configurations.')
    .helpOption('-h, --help', 'Display this help text.')
    .parse();

const cli_options = program.opts();
const options = { ...config_file, ...cli_options };

if (!options.no_save) {
    // save out the config file with the current settings
    fs.writeFile('config_file.json', beautify(options), (error: any) => {
        if (error) throw error;
    });
}

InitLogging({
    logDir: options.log_folder,
    logMessagesToConsole: options.console_messages,
    logLevelConsole: options.log_level_console,
    logLevelFile: options.log_level_file,
});

Logger.info(`${pjson.name} v${pjson.version} starting...`);
if (options.log_config) {
    Logger.info(`Config: ${stringify(options)}`);
}

const app = express();

const serverOpts: IServerConfig = {
    streamerPort: options.streamer_port,
    playerPort: options.player_port,
    sfuPort: options.sfu_port,
    peerOptions: options.peer_options
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

if (options.stdin) {
    initInputHandler(options, signallingServer);
}
