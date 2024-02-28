# Wilbur

A Direct replacement for cirrus.

Wilbur is a small intermediary application that sits between streamers and other peers. It handles the initial connection negotiations and some other small ongoing control messages between peers as well as acting as a simple web server for serving the [Frontend](/Frontend/README.md) web application.

Differences of behaviour from the old cirrus are described [here](from_cirrus.md).

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
  -V, --version                     output the version number
  --log_folder <path>               Sets the path for the log files. (default: "logs")
  --log_level_console <level>       Sets the logging level for console messages. (choices: "debug", "info", "warning",
                                    "error", default: "info")
  --log_level_file <level>          Sets the logging level for log files. (choices: "debug", "info", "warning",
                                    "error", default: "info")
  --console_messages [detail]       Displays incoming and outgoing signalling messages on the console. (choices:
                                    "basic", "verbose", "formatted", preset: "basic")
  --streamer_port <port>            Sets the listening port for streamer connections. (default: "8888")
  --player_port <port>              Sets the listening port for player connections. (default: "80")
  --sfu_port <port>                 Sets the listening port for SFU connections. (default: "8889")
  --serve                           Enables the webserver on player_port. (default: false)
  --http_root <path>                Sets the path for the webserver root. (default: "www")
  --homepage <filename>             The default html file to serve on the web server. (default: "player.html")
  --https                           Enables the webserver on https_port and enabling SSL (default: false)
  --https_port <port>               Sets the listen port for the https server. (default: 443)
  --ssl_key_path <path>             Sets the path for the SSL key file. (default: "ssl/key.pem")
  --ssl_cert_path <path>            Sets the path for the SSL certificate file. (default: "ssl/cert.pem")
  --https_redirect                  Enables the redirection of connection attempts on http to https. If this is not set
                                    the webserver will only listen on https_port. Player websockets will still listen
                                    on player_port. (default: false)
  --rest_api                        Enables the rest API interface that can be accessed at
                                    <server_url>/api/api-definition (default: false)
  --peer_options <json-string>      Additional JSON data to send in peerConnectionOptions of the config message.
  --matchmaker                      Enable matchmaker connection. (default: false)
  --matchmaker_address <address>    Sets the matchmaker address to connect to. (default: "127.0.0.1")
  --matchmaker_port <port>          Sets the matchmaker port to connect to. (default: "9999")
  --matchmaker_retry <seconds>      Sets the delay before reconnecting to the matchmaker after a disconnect. (default:
                                    "5")
  --matchmaker_keepalive <seconds>  Sets the delay between matchmaker pings. (default: "30")
  --public_ip <ip address>          The public IP address to be used to connect to this server. Only needed when using
                                    matchmaker. (default: "127.0.0.1")
  --log_config                      Will print the program configuration on startup. (default: false)
  --stdin                           Allows stdin input while running. (default: false)
  --no_config                       Skips the reading of the config file. Only CLI options will be used. (default:
                                    false)
  --config_file <path>              Sets the path of the config file. (default: "config.json")
  --no_save                         On startup the given configuration is resaved out to config.json. This switch will
                                    prevent this behaviour allowing the config.json file to remain untouched while
                                    running with new configurations. (default: false)
  -h, --help                        Display this help text.
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
This implementation is built on the [Signalling](../Signalling) library which is supplied as a library for developing signalling applications. Visit its [documentation](../Signalling/docs) for more information.
