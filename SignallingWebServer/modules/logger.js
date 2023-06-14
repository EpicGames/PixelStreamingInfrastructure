const logging = require('./logging.js');

module.exports = class Logger {
    constructor(config){
        this.config = config;
    }

    logIncoming(sourceName, msg) {
        if (this.config.LogVerbose)
            console.logColor(logging.Blue, "\x1b[37m%s ->\x1b[34m %s", sourceName, JSON.stringify(msg));
        else
            console.logColor(logging.Blue, "\x1b[37m%s ->\x1b[34m %s", sourceName, msg.type);
    }

    logOutgoing(destName, msg) {
        if (this.config.LogVerbose)
            console.logColor(logging.Green, "\x1b[37m%s <-\x1b[32m %s", destName, JSON.stringify(msg));
        else
            console.logColor(logging.Green, "\x1b[37m%s <-\x1b[32m %s", destName, msg.type);
    }

    logForward(srcName, destName, msg) {
        if (this.config.LogVerbose)
            console.logColor(logging.Green, "\x1b[37m%s -> %s\x1b[32m %s", srcName, destName, JSON.stringify(msg));
        else
            console.logColor(logging.Green, "\x1b[37m%s -> %s\x1b[32m %s", srcName, destName, msg.type);
    }
}
