# Wilbur

The signalling server is a small intermediary application that sits between streamers and other peers. It handles the initial connection negotiations and some other small ongoing control messages between peers as well as acting as a simple web server for serving the [Frontend](/Frontend/README.md) web application.

This is a new implementation of the now deprecated cirrus. Differences in behaviour are described [here](from_cirrus.md).

## Building
Building is handled by `npm` and `tsc` as a very basic typescript project. The easiest method is to invoke
```
npm run build
```
Which will output built files into the `build` directory.

## Running
You can run with both `node` directly or the `npm start` script.
```
npm start -- [arguments]
```
or
```
node build/index.js [arguments]
```
Invoking `npm start -- --help` or `node build/index.js --help` will display the configuration options.
```
Usage: node build/index.js [options]

A basic signalling server application for Unreal Engine's Pixel Streaming applications.

Options:
  -V, --version                 output the version number
  --log_folder <path>           Sets the path for the log files. (default: "logs")
  --log_level_console <level>   Sets the logging level for console messages. (choices: "debug", "info", "warning",
                                "error", default: "info")
  --log_level_file <level>      Sets the logging level for log files. (choices: "debug", "info", "warning", "error",
                                default: "info")
  --console_messages [detail]   Displays incoming and outgoing signalling messages on the console. (choices: "basic",
                                "verbose", "formatted", preset: "basic")
  --streamer_port <port>        Sets the listening port for streamer connections. (default: "8888")
  --player_port <port>          Sets the listening port for player connections. (default: "80")
  --sfu_port <port>             Sets the listening port for SFU connections. (default: "8889")
  --serve                       Enables the webserver on player_port. (default: false)
  --http_root <path>            Sets the path for the webserver root. (default: "www")
  --homepage <filename>         The default html file to serve on the web server. (default: "player.html")
  --peer_options <json-string>  Additional JSON data to send in peerConnectionOptions of the config message.
  --public_ip <ip address>      The public IP address to be used to connect to this server.
  --log_config                  Will print the program configuration on startup. (default: false)
  --stdin                       Allows stdin input while running. (default: false)
  --no_config                   Skips the reading of the config file. Only CLI options will be used. (default: false)
  --config_file <path>          Sets the path of the config file. (default: "config.json")
  --no_save                     On startup the given configuration is resaved out to config.json. This switch will
                                prevent this behaviour allowing the config.json file to remain untouched while running
                                with new configurations. (default: false)
  -h, --help                    Display this help text.
```
These CLI options can also be described in a `config.json` (default config file overridable with --config_file) by specifying the command option name and value in a simple JSON object. eg.
```
{
	"log_folder": "logs",
	"log_level_console": "info",
	"log_level_file": "info",
	"streamer_port": "8888",
	"player_port": "80",
	"sfu_port": "8889",
	"serve": true,
	"http_root": "www",
	"homepage": "player.html",
	"log_config": false,
	"stdin": false
}
```
Given these options, to start the server with the closest behaviour as the old cirrus, you would invoke,
```
npm start -- --console_messages verbose --serve --http_root Public --homepage player.html
```
Note that `Public` being used as the http root assumes your Frontend is in that directory from the old behaviour of the scripts. The new convenience scripts (`platform_scripts` directory) will now build the frontend into the `www` directory.

## Development
Documentation on this implementation can be found [here](./docs). This implementation is built on the [Common](../Common) library which is supplied as a library for developing signalling applications. Visit its [documentation](../Common/docs) for more information.
