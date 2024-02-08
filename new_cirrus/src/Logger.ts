const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');

const { combine, timestamp, json, align, printf, colorize } = winston.format;

class LoggerWrapper {
    logger: any;
    logMessagesToConsole: boolean;

    constructor(logDirPath?: string) {
        if (!logDirPath) {
            logDirPath = 'logs';
        }
        this.logMessagesToConsole = false;
        this.logger = winston.createLogger({
            level: 'info',
            transports: [
                this.createConsoleTransport(),
                this.createFileTransport(logDirPath),
            ],
        });
    }

    debug(...args: any[]) { this.logger.debug(...args); }
    info(...args: any[]) { this.logger.info(...args); }
    warn(...args: any[]) { this.logger.warn(...args); }
    error(...args: any[]) { this.logger.error(...args); }
    fatal(...args: any[]) { this.logger.fatal(...args); }

    private createConsoleTransport() {
        return new winston.transports.Console({
                    format: combine(
                        this.createProtoMessageFilter()(),
                        timestamp({ format: 'HH:mm:ss.SSS' }),
                        colorize(),
                        this.createConsoleFormat(),
                    ),
                });
    }

    private createConsoleFormat() {
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

    private createProtoMessageFilter() {
        return winston.format((info: any, opts: any) => {
            if (typeof info.message !== 'string'
                && info.message.event == 'proto_message'
                && !this.logMessagesToConsole) {
                return false;
            }
            return info;
        });
    }

    private createFileTransport(logDirPath: string) {
        return new winston.transports.DailyRotateFile({
            filename: path.join(logDirPath, 'server-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxFiles: '14d',
            format: combine(
                        timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
                        this.createFileFormat(),
                    ),
        });
    }

    private createFileFormat() {
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
}

export const Logger = new LoggerWrapper();
