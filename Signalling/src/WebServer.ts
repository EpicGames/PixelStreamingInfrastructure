import express from 'express';
import path from 'path';
import fs from 'fs';
import http from 'http';
import https from 'https';
import helmet from 'helmet';
import { Logger } from './Logger';
import RateLimit from 'express-rate-limit';

/* eslint-disable  @typescript-eslint/no-var-requires */
const hsts = require('hsts');
/* eslint-enable  @typescript-eslint/no-var-requires */

/**
 * An interface that describes the possible options to pass to
 * WebServer.
 */
export interface IWebServerConfig {
    // The port to run the webserver on. 80 by default.
    httpPort: number;

    // The root of the serve directory. Current working directory by default.
    root: string;

    // The filename to direct connections to if none suppllied in the url. player.html by default.
    homepageFile: string;

    // An optional rate limit to prevent overloading.
    perMinuteRateLimit?: number;

    // when set an https server will be created
    httpsPort?: number;

    // the ssl key data for https
    ssl_key?: Buffer;

    // the ssl cert data for https
    ssl_cert?: Buffer;
}

/**
 * An object to manage the initialization of a web server. Used to serve the
 * pixel streaming frontend.
 */
export class WebServer {
    httpServer: http.Server;
    httpsServer: https.Server;

    constructor(app: any, config: IWebServerConfig) {
        Logger.debug('Starting WebServer with config: %s', config);

        this.httpServer = http.createServer(app);
        this.httpServer.listen(config.httpPort, () => {
            Logger.info(`Http server listening on port ${config.httpPort}`);
        });

        if (config.httpsPort) {
            const options = { key: config.ssl_key, cert: config.ssl_cert };
            this.httpsServer = https.createServer(options, app);
            this.httpsServer.listen(config.httpsPort, () => {
                Logger.info(`Https server listening on port ${config.httpsPort}`);
            });

            app.use(helmet());
            app.use(hsts({
                maxAge: 15552000  // 180 days in seconds
            }));

            //Setup http -> https redirect
            Logger.info(`Redirecting http->https`);
            app.use((req: any, res: any, next: any) => {
                if (!req.secure) {
                    if (req.get('Host')) {
                        const hostAddressParts = req.get('Host').split(':');
                        let hostAddress = hostAddressParts[0];
                        if (config.httpsPort != 443) {
                            hostAddress = `${hostAddress}:${config.httpsPort}`;
                        }
                        return res.redirect(['https://', hostAddress, req.originalUrl].join(''));
                    } else {
                        Logger.error(`Unable to get host name from header. Requestor ${req.ip}, url path: '${req.originalUrl}', available headers ${JSON.stringify(req.headers)}`);
                        return res.status(400).send('Bad Request');
                    }
                }
                next();
            });
        }

        app.use(express.static(config.root));

        // Request has been sent to site root, send the homepage file
        app.get('/', function (req: any, res: any) {
            // Try a few paths, see if any resolve to a homepage file the user has set
            const p = path.resolve(path.join(config.root, config.homepageFile));
            if (fs.existsSync(p)) {
                // Send the file for browser to display it
                res.sendFile(p);
                return;
            }

            // Catch file doesn't exist, and send back 404 if not
            const error = 'Unable to locate file ' + config.homepageFile;
            Logger.error(error);
            res.status(404).send(error);
            return;
        });

        if (config.perMinuteRateLimit) {
            const limiter = RateLimit({
              windowMs: 60 * 1000, // 1 minute
              max: config.perMinuteRateLimit
            });

            // apply rate limiter to all requests
            app.use(limiter);
        }
    }
}
