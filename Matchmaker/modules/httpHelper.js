// The generalized HTTPS helper method, the default one within SS is too restrictive in terms of options

const https = require('https');

function sendHttpRequest(options, body, callback, error) {
    const req = https.request(options, (res) => {
        let resData = '';
        console.log(`statusCode: ${res.statusCode}`);
    
        res.on('data', (chunk) => {
            process.stdout.write(chunk);
            resData += chunk;
        });

        res.on('end', () => {
            if(typeof callback != "undefined")
                callback(res, resData);
        });
    });

	req.on('timeout', function () {
		console.log("Request timed out. " + (options.timeout / 1000) + " seconds expired");

		// Source: https://github.com/nodejs/node/blob/master/test/parallel/test-http-client-timeout-option.js#L27
		req.destroy();
	});

	req.on("error", (err) => {
		if(typeof error != "undefined") {
			error(err);
		} else {
			console.log("Error: " + err.message);
		}
	});
    
    if (body) {
        req.write(JSON.stringify(body));
    }
    
    req.end();
}

module.exports = sendHttpRequest;