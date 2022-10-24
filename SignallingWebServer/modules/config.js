// Copyright Epic Games, Inc. All Rights Reserved.

//-- Provides configuration information from file and combines it with default values and command line arguments --//
//-- Hierachy of values: Default Values < Config File < Command Line arguments --//

const fs = require('fs');
const path = require('path');
const argv = require('yargs').argv;

function initConfig(configFile, defaultConfig){
	defaultConfig = defaultConfig || {};

	// Using object spread syntax: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax#Spread_in_object_literals
	let config = {...defaultConfig};
	try{
		let configData = fs.readFileSync(configFile, 'UTF8');
		fileConfig = JSON.parse(configData);	

		// Capitilize the config options 
		fileConfig = capitalizeConfig(fileConfig);

		config = {...config, ...fileConfig}
		// Update config file with any additional defaults (does not override existing values if default has changed)
		fs.writeFileSync(configFile, JSON.stringify(config, null, '\t'), 'UTF8');
	} catch(err) {
		if (err.code === 'ENOENT') {
			console.log("No config file found, writing defaults to log file " + configFile);
			fs.writeFileSync(configFile, JSON.stringify(config, null, '\t'), 'UTF8');
		} else if (err instanceof SyntaxError) {
			console.log(`ERROR: Invalid JSON in ${configFile}, ignoring file config, ${err}`)
		} else {
			console.log(`ERROR: ${err}`);
		}
	}

	try{
		//Make a copy of the command line args and remove the unneccessary ones
		//The _ value is an array of any elements without a key
		let commandLineConfig = {...argv}
		delete commandLineConfig._;
		delete commandLineConfig.help;
		delete commandLineConfig.version;
		delete commandLineConfig['$0'];
		config = {...config, ...commandLineConfig}
	} catch(err) {
		console.log(`ERROR: ${err}`);
	}
	return config;
}

function capitalizeConfig(configData) {
    let key, newKey;

    for (key in configData) {
        if (configData.hasOwnProperty(key)) {
            newKey = key.charAt(0).toUpperCase() + key.slice(1);

            if (newKey !== key) {
                configData[newKey] = configData[key];
                delete(configData[key]);
            }

            // recurse
            if (typeof configData[newKey] === "object") {
                capitalizeConfig(configData[newKey]);
            }
        }
    }

    return configData;
}

module.exports = {
	init: initConfig
}