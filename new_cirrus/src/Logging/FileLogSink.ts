import { ILogSink, LogLevel, StructuredLog } from './Logger';
import { zeroPad } from './Utils';
import fs from 'fs';
import stream from 'stream';

export class FileLogSink implements ILogSink {
    private minLogLevel: LogLevel;
    private timestamp: boolean;
    private fileStream: stream.Writable;

    constructor(path: string) {
        this.minLogLevel = LogLevel.Info;
        this.timestamp = true;
        this.fileStream = fs.createWriteStream(path, { flags: 'a' });

        this.log(this.minLogLevel, `Log file opened.`);
    }

    log(logLevel: LogLevel, message: string | StructuredLog): void {
        if (logLevel >= this.minLogLevel) {
            const timestamp = this.getTimestamp();
            const recordType = this.getRecordType(message);
            const content = this.getContent(message);
            this.fileStream.write(`${timestamp} ${recordType} ${content}\n`);
        }
    }

    private getTimestamp(): string {
        // for decent structured logging we might want to change this to some kind of machine readable timestamp
        // but for now this is easier to read for humans.
        let date = new Date();
        return `${date.getFullYear()}.${zeroPad(date.getMonth(), 2)}.${zeroPad(date.getDate(), 2)}.${zeroPad(date.getHours(), 2)}.${zeroPad(date.getMinutes(), 2)}.${zeroPad(date.getSeconds(), 2)}`;
    }

    private getRecordType(message: string | StructuredLog): string {
        if (typeof message === 'string') {
            return 'MESSAGE';
        } else {
            return 'DETAIL';
        }
    }

    private getContent(message: string | StructuredLog): string {
        if (typeof message === 'string') {
            return JSON.stringify({ text: message });
        } else {
            return JSON.stringify(message);
        }
    }
}
