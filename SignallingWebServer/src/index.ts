// Copyright Epic Games, Inc. All Rights Reserved.
import express from 'express';
import fs from 'fs';
import path from 'path';
import {
    SignallingServer,
    IServerConfig,
    WebServer,
    InitLogging,
    Logger,
    IWebServerConfig
} from '@epicgames-ps/lib-pixelstreamingsignalling-ue5.8';
import { beautify, IProgramOptions } from './Utils';
import { initInputHandler } from './InputHandler';
import { Command, Option } from 'commander';
import { initialize } from 'express-openapi';
import configHandler from './paths/config';
import playersHandler from './paths/players';
import playerByIdHandler from './paths/players/{playerId}';
import statusHandler from './paths/status';
import streamersHandler from './paths/streamers';
import streamerByIdHandler from './paths/streamers/{streamerId}';

// eslint-disable-next-line  @typescript-eslint/no-unsafe-assignment
const pjson = require('../package.json');

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
// possible config file options
let config_file: IProgramOptions = {};
const configArgsParser = new Command()
    .option('--no_config', 'Skips the reading of the config file. Only CLI options will be used.', false)
    .option(
        '--config_file <path>',
        'Sets the path of the config file.',
        `${path.resolve(__dirname, '..', 'config.json')}`
    )
    .helpOption(false)
    .allowUnknownOption() // ignore unknown options as we are doing a minimal parse here
    .parse()
    .opts();
// If we do not get passed `--no_config` then attempt open the config file
if (!configArgsParser.no_config) {
    try {
        if (fs.existsSync(configArgsParser.config_file)) {
            console.log(`Config file configured as: ${configArgsParser.config_file}`);
            const configData = fs.readFileSync(configArgsParser.config_file, { encoding: 'utf8' });
            config_file = JSON.parse(configData);
        } else {
            // Even though proper logging is not intialized, logging here is better than nothing.
            console.log(`No config file found at: ${configArgsParser.config_file}`);
        }
    } catch (error: unknown) {
        console.error(error);
    }
}

const program = new Command();
program
    .name('node dist/index.js')
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    .description(pjson.description)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    .version(pjson.version);

// For any switch that doesn't take an argument, like --serve, its important to give it a default value.
// Without the default, not supplying the default will mean the option is `undefined` in
// `cli_option`s` and loading from the configuration file will not work as intended.
// The way the configuration file works is that if it is found it will parsed for key/values that match
// the argument names specified below. If one is found it will become the new default value for that option.
// This allow the user to have values in the configuration file but also override them by specifying an argument on the command line.
program
    .option('--log_folder <path>', 'Sets the path for the log files.', config_file.log_folder || 'logs')
    .addOption(
        new Option('--log_level_console <level>', 'Sets the logging level for console messages.')
            .choices(['debug', 'info', 'warning', 'error'])
            .default(config_file.log_level_console || 'info')
    )
    .addOption(
        new Option('--log_level_file <level>', 'Sets the logging level for log files.')
            .choices(['debug', 'info', 'warning', 'error'])
            .default(config_file.log_level_file || 'info')
    )
    .addOption(
        new Option(
            '--console_messages [detail]',
            'Displays incoming and outgoing signalling messages on the console.'
        )
            .choices(['basic', 'verbose', 'formatted'])
            .preset(config_file.console_messages || 'basic')
    )
    .option(
        '--streamer_port <port>',
        'Sets the listening port for streamer connections.',
        config_file.streamer_port || '8888'
    )
    .option(
        '--player_port <port>',
        'Sets the listening port for player connections.',
        config_file.player_port || '80'
    )
    .option(
        '--sfu_port <port>',
        'Sets the listening port for SFU connections.',
        config_file.sfu_port || '8889'
    )
    .option(
        '--max_players <number>',
        'Sets the maximum number of subscribers per streamer. 0 = unlimited',
        config_file.max_players || '0'
    )
    .option(
        '--player_keepalive_timeout <milliseconds>',
        'Disconnect a player after this many milliseconds without a keepalive response. 0 = disabled',
        config_file.player_keepalive_timeout || '30000'
    )
    .option('--serve', 'Enables the webserver on player_port.', config_file.serve || false)
    .option(
        '--http_root <path>',
        'Sets the path for the webserver root.',
        config_file.http_root || `${path.resolve(__dirname, '..', 'www')}`
    )
    .option(
        '--homepage <filename>',
        'The default html file to serve on the web server.',
        config_file.homepage || 'player.html'
    )
    .option('--https', 'Enables the webserver on https_port and enabling SSL', config_file.https || false)
    .addOption(
        new Option('--https_port <port>', 'Sets the listen port for the https server.')
            .implies({ https: true })
            .default(config_file.https_port || 443)
    )
    .option(
        '--ssl_key_path <path>',
        'Sets the path for the SSL key file.',
        config_file.ssl_key_path || 'certificates/client-key.pem'
    )
    .option(
        '--ssl_cert_path <path>',
        'Sets the path for the SSL certificate file.',
        config_file.ssl_cert_path || 'certificates/client-cert.pem'
    )
    .option(
        '--https_redirect',
        'Enables the redirection of connection attempts on http to https. If this is not set the webserver will only listen on https_port. Player websockets will still listen on player_port.',
        config_file.https_redirect || false
    )
    .option(
        '--rest_api',
        'Enables the rest API interface that can be accessed at <server_url>/api/api-definition',
        config_file.rest_api || false
    )
    .option(
        '--cors',
        'Enables CORS headers on the webserver. Required for browser-based clients hosted on a different origin to call routes such as the REST API.',
        config_file.cors || false
    )
    .option(
        '--cors_allowed_origins <origins>',
        'Comma-separated list of allowed origins (e.g. "https://example.com,https://other.example.com"). If omitted, all origins are allowed.',
        config_file.cors_allowed_origins || ''
    )
    .option(
        '--cors_allowed_methods <methods>',
        'Comma-separated list of allowed HTTP methods. Defaults to the cors middleware default if omitted.',
        config_file.cors_allowed_methods || ''
    )
    .option(
        '--cors_allowed_headers <headers>',
        "Comma-separated list of allowed request headers. If omitted, the request's Access-Control-Request-Headers value is mirrored.",
        config_file.cors_allowed_headers || ''
    )
    .option(
        '--cors_credentials',
        'Allow credentials (cookies, authorization headers) on cross-origin requests.',
        config_file.cors_credentials || false
    )
    .addOption(
        new Option(
            '--peer_options <json-string>',
            'Additional JSON data to send in peerConnectionOptions of the config message.'
        )
            .argParser(JSON.parse)
            .default(config_file.peer_options || '')
    )
    .addOption(
        new Option(
            '--peer_options_file <filename>',
            'Additional JSON data to send in peerConnectionOptions of the config message. This allows you to provide JSON data without having to deal with it on the command line.'
        ).default(config_file.peer_options_file || '')
    )
    .option(
        '--reverse-proxy',
        'Enables reverse proxy mode. This will trust the X-Forwarded-For header.',
        config_file.reverse_proxy || false
    )
    .addOption(
        new Option(
            '--reverse-proxy-num-proxies <number>',
            'Sets the number of proxies to trust. This is used to calculate the real client IP address.'
        )
            .implies({ reverse_proxy: true })
            .default(config_file.reverse_proxy_num_proxies || 1)
    )
    .option(
        '--log_config',
        'Will print the program configuration on startup.',
        config_file.log_config || false
    )
    .option('--stdin', 'Allows stdin input while running.', config_file.stdin || false)
    .option(
        '--save',
        'After arguments are parsed the config.json is saved with whatever arguments were specified at launch.',
        config_file.save || false
    )
    .helpOption('-h, --help', 'Display this help text.')
    .allowUnknownOption() // ignore unknown options which will allow versions to be swapped out into existing scripts with maybe older/newer options
    .parse();

// parsed command line options
const cli_options: IProgramOptions = program.opts();
const options: IProgramOptions = { ...cli_options };

// save out new configuration (unless disabled)
if (options.save) {
    // dont save certain options
    const save_options = { ...options };
    delete save_options.no_config;
    delete save_options.config_file;
    delete save_options.save;

    // save out the config file with the current settings
    fs.writeFile(configArgsParser.config_file, beautify(save_options), (error: any) => {
        if (error) throw error;
    });
}

InitLogging({
    logDir: options.log_folder,
    logMessagesToConsole: options.console_messages,
    logLevelConsole: options.log_level_console,
    logLevelFile: options.log_level_file
});

// read the peer_options_file
if (options.peer_options_file) {
    if (!fs.existsSync(options.peer_options_file)) {
        Logger.error(`peer_options_file "${options.peer_options_file}" does not exist.`);
        throw Error(`Failed to find a peer options config file a file called ${options.peer_options_file}.`);
    }

    options.peer_options = JSON.parse(fs.readFileSync(options.peer_options_file, 'utf-8'));
} else if (options.peer_options) {
    Logger.warn(
        `The --peer_options cli flag has many issues with passing JSON data on the command line. It is recommended that you use --peer_options_file instead.`
    );
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
Logger.info(`${pjson.name} v${pjson.version} starting...`);
if (options.log_config) {
    Logger.info('Config:');
    for (const key in options) {
        Logger.info(`"${key}": ${JSON.stringify(options[key])}`);
    }
}

const app = express();
if (options.reverse_proxy) {
    app.set('trust proxy', options.reverse_proxy_num_proxies);
}

const serverOpts: IServerConfig = {
    streamerPort: options.streamer_port,
    playerPort: options.player_port,
    sfuPort: options.sfu_port,
    peerOptions: options.peer_options,
    maxSubscribers: options.max_players,
    playerKeepaliveTimeout: Number(options.player_keepalive_timeout)
};

const shouldServerStart = options.serve || options.rest_api;
if (shouldServerStart) {
    const webserverOptions: IWebServerConfig = {
        httpPort: options.player_port,
        root: options.http_root,
        homepageFile: options.homepage,
        serveStatic: options.serve
    };

    if (options.cors) {
        const splitCsv = (value: unknown): string[] => {
            if (typeof value !== 'string' || value.length === 0) return [];
            return value
                .split(',')
                .map((s) => s.trim())
                .filter((s) => s.length > 0);
        };

        webserverOptions.cors = {
            enabled: true,
            allowedOrigins: splitCsv(options.cors_allowed_origins),
            allowedMethods: splitCsv(options.cors_allowed_methods),
            allowedHeaders: splitCsv(options.cors_allowed_headers),
            credentials: !!options.cors_credentials
        };
    }

    if (options.serve) {
        Logger.info('Static file serving enabled.');
    } else if (options.rest_api) {
        Logger.info('REST API enabled; static file serving disabled.');
    }

    if (options.https) {
        webserverOptions.httpsPort = options.https_port;
        const sslKeyPath = path.join(__dirname, '..', options.ssl_key_path);
        const sslCertPath = path.join(__dirname, '..', options.ssl_cert_path);
        if (fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
            Logger.info(`Reading SSL key and cert. Key path: ${sslKeyPath} | Cert path: ${sslCertPath}`);
            webserverOptions.ssl_key = fs.readFileSync(sslKeyPath);
            webserverOptions.ssl_cert = fs.readFileSync(sslCertPath);
        } else {
            Logger.warn(`No SSL key/cert found. Key path: ${sslKeyPath} | Cert path: ${sslCertPath}`);
        }
        webserverOptions.https_redirect = options.https_redirect;
    }
    const webServer = new WebServer(app, webserverOptions);
    if (!options.https || webserverOptions.https_redirect) {
        serverOpts.httpServer = webServer.httpServer;
    }
    serverOpts.httpsServer = webServer.httpsServer;
}

const signallingServer = new SignallingServer(serverOpts);

if (options.stdin) {
    initInputHandler(options, signallingServer);
}

if (options.rest_api) {
    initialize({
        app,
        docsPath: '/api-definition',
        exposeApiDocs: true,
        apiDoc: './apidoc/api-definition-base.yml',
        paths: [
            { path: '/config', module: configHandler },
            { path: '/players', module: playersHandler },
            { path: '/players/{playerId}', module: playerByIdHandler },
            { path: '/status', module: statusHandler },
            { path: '/streamers', module: streamersHandler },
            { path: '/streamers/{streamerId}', module: streamerByIdHandler }
        ],
        dependencies: {
            signallingServer
        }
    }).catch((err: unknown) => Logger.error(`REST API initialization failed: ${String(err)}`));
}
