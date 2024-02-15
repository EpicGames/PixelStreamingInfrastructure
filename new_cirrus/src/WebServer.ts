import express from 'express';
import path from 'path';
import fs from 'fs';
import { Logger } from './Logger';
import RateLimit from 'express-rate-limit';

/**
 * An interface that describes the possible options to pass to
 * WebServer.
 */
interface IWebServerConfig {
	// The port to run the webserver on. 80 by default.
	port?: number;

	// The root of the serve directory. Current working directory by default.
	root?: string;

	// The filename to direct connections to if none suppllied in the url. player.html by default.
	homepageFile: string;

	// An optional rate limit to prevent overloading.
	perMinuteRateLimit?: number;
}

/**
 * An object to manage the initialization of a web server. Used to serve the
 * pixel streaming frontend.
 */
export class WebServer {
	constructor(app: any, server: any, config: IWebServerConfig) {
		Logger.debug('Starting WebServer with config: %s', config);

		const httpPort = config.port || 80;
		const serveRoot = config.root || '.';
		const homepageFile = config.homepageFile || 'index.html';

		server.listen(httpPort, function () {
			Logger.info(`Http server listening on port ${httpPort}`);
		});

		app.use(express.static(serveRoot));

		// Request has been sent to site root, send the homepage file
		app.get('/', function (req: any, res: any) {
			// Try a few paths, see if any resolve to a homepage file the user has set
			const p = path.resolve(path.join(serveRoot, homepageFile));
			if (fs.existsSync(p)) {
				// Send the file for browser to display it
				res.sendFile(p);
				return;
			}

			// Catch file doesn't exist, and send back 404 if not
			const error = 'Unable to locate file ' + homepageFile;
			Logger.error(error);
			res.status(404).send(error);
			return;
		});

		if (config.perMinuteRateLimit) {
			var limiter = RateLimit({
			  windowMs: 60 * 1000, // 1 minute
			  max: config.perMinuteRateLimit
			});

			// apply rate limiter to all requests
			app.use(limiter);
		}
	}
}
