const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');

const { combine, timestamp, json, align, printf, colorize, splat } = winston.format;

export let Logger = createDefaultLogger();

interface IConfig {
    logDir?: string;
    logMessagesToConsole?: boolean;
    logLevelConsole?: string;
    logLevelFile?: string;
}

let logMessagesToConsole = false;

export function InitLogging(config: IConfig) {
    const logDir = config.logDir || 'logs';
    const logMessagesToConsole = config.logMessagesToConsole || false;
    const logLevelConsole = config.logLevelConsole || 'info';
    const logLevelFile = config.logLevelFile || 'info';

    Logger = winston.createLogger({
        transports: [
            createConsoleTransport(logLevelConsole),
            createFileTransport(logDir, logLevelFile),
        ],
    });
}

function createDefaultLogger() {
    return winston.createLogger({
        level: 'info',
        format: winston.format.cli(),
        transports: [new winston.transports.Console()],
    })
}

function createConsoleTransport(logLevel: string) {
    return new winston.transports.Console({
        level: logLevel,
        format: combine(
            createProtoMessageFilter()(),
            timestamp({ format: 'HH:mm:ss.SSS' }),
            colorize(),
            splat(),
            createConsoleFormat(),
        ),
    });
}

function createConsoleFormat() {
    return printf((logObj: any) => {
        const prefix = `[${logObj.timestamp}] ${logObj.level}: `;
        if (typeof logObj.message === 'string') {
            return prefix + logObj.message;
        } else if (logObj.message.event && logObj.message.event == 'proto_message') {
            const { direction, receiver, sender, target, protoMessage } = logObj.message;
            switch (direction) {
            case 'incoming': return prefix + `> ${receiver} :: [${protoMessage.type}]`;
            case 'outgoing': return prefix + `< ${sender} :: [${protoMessage.type}]`;
            case 'forward': return prefix + `${receiver} > ${target} :: [${protoMessage.type}]`;
            default: return prefix + `Unknown proto direction: ${direction}`;
            }
        }
        return false;
    });
}

function createProtoMessageFilter() {
    return winston.format((info: any, opts: any) => {
        if (typeof info.message !== 'string'
            && info.message.event == 'proto_message'
            && !logMessagesToConsole) {
            return false;
        }
        return info;
    });
}

function createFileTransport(logDirPath: string, logLevel: string) {
    return new winston.transports.DailyRotateFile({
        level: logLevel,
        filename: path.join(logDirPath, 'server-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxFiles: '14d',
        format: combine(
                    timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
                    splat(),
                    createFileFormat(),
                ),
    });
}

function createFileFormat() {
    return printf((logObj: any) => {
        if (typeof logObj.message === 'string') {
            const { timestamp, level, message } = logObj;
            return JSON.stringify({
                timestamp,
                level,
                event: 'message',
                message,
            });
        } else if (logObj.message.event && logObj.message.event == 'proto_message') {
            const { timestamp, level, message } = logObj;
            return JSON.stringify({
                timestamp,
                level,
                ...message
            });
        }
    });
}
