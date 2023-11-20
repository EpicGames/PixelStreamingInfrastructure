# Pixel Streaming Signalling Server

The signalling server is a small intermediary application that sits between streamers and other peers. It handles the initial connection negotiations and some other small ongoing control messages between peers as well as acting as a simple web server for serving the [Frontend](/Frontend/README.md) web application.

## Configuration

Configuration of the signalling server is handled via the config.js file in the SignallingWebServer directory. The following are its supported options.
| Name | Type | Default | Description |
|-|-|-|-|
| UseFrontend | Boolean | false | Enables or disables the use of the Frontend. |
| UseMatchmaker | Boolean | false | Enables or disables the use of the [Matchmaker](/Matchmaker) application. |
| UseHTTPS | Boolean | false | Enables or disables ssl for the serving of the Frontend. |
| HTTPSCertFile | String | './certificates/client-cert.pem' | The path to the SSL cert file for when HTTPS is enabled. |
| HTTPSKeyFile | String | './certificates/client-key.pem' | The path to the SSL key file for when HTTPS is enabled. |
| LogToFile | Boolean | true | Enable or disable logging to a file in the 'logs' folder. |
| LogVerbose | Boolean | true | Enable or disable verbose logging. Adds a lot of extra information to logs. |
| HomepageFile | String | 'player.html' | The root file of the frontend web application. |
| AdditionalRoutes | Map | | Additional routes for the web application. |
| EnableWebserver | Boolean | true | Enables or disables the serving of the frontend through the internal web server. Disbable this if you are serving your own frontend. |
| MatchmakerAddress | String | | The IP/hostname of the matchmaker application. |
| MatchmakerPort | Number | 9999 | The port the matchmaker is listening on. |
| PublicIp | String | "localhost" | The public IP/hostname of the host that the signalling server is listening on. This is used by the matchmaker. |
| HttpPort | Number | 80 | The port for the internal webserver to listen on. |
| HttpsPort | Number | 443 | The port for the internal webserver to listen on when HTTPS is enabled. |
| StreamerPort | Number | 8888 | The port to listen on for new streamer connections. |
| SFUPort | Number | 8889 | The port to listen on for new SFU connections. |
| MaxPlayerCount | Number | -1 | A limit for connected players in total on this signalling server. -1 to disable limit. |
| DisableSSLCert | Boolean | true | When HTTPS is enabled and this is true, insecure certificates can be used. This is convenient for local testing but please DO NOT SHIP THIS IN PRODUCTION |

## Running

Several scripts are supplied for Windows and Linux in the [platform_scripts](platform_scripts/) folder. These are the easiest way to get the server running under common situations. They can also be used as a reference for new situations.
