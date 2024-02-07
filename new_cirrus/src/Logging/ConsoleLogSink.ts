import { BaseMessage } from '@epicgames-ps/lib-pixelstreamingcommon-ue5.5';
import { Logger, ILogSink, LogLevel, logLevelToString, StructuredLog } from './Logger';
import { stringify, beautify } from '../utils';
import { zeroPad } from './Utils';

export class ConsoleLogSink implements ILogSink {
    private minLogLevel: LogLevel;
    private timestamp: boolean;

    constructor() {
        this.minLogLevel = LogLevel.Info;
        this.timestamp = true;
    }

    log(logLevel: LogLevel, message: string | StructuredLog): void {
        if (logLevel >= this.minLogLevel) {
        	const timestamp = this.getTimestamp();
        	const logLevelLabel = this.getLogLevelLabel(logLevel);
        	const content = this.getContent(message);
        	console.log(`${timestamp}${logLevelLabel} ${content}`);
        }
    }

    private getTimestamp(): string {
    	if (this.timestamp) {
		    let date = new Date();
		    return `${zeroPad(date.getHours(), 2)}:${zeroPad(date.getMinutes(), 2)}:${zeroPad(date.getSeconds(), 2)}.${zeroPad(date.getMilliseconds(), 3)} `;
		} else {
			return '';
		}
	}

	private getLogLevelLabel(logLevel: LogLevel): string {
		return `[${logLevelToString(logLevel)}]`;
	}

    private getContent(message: string | StructuredLog): string {
        if (typeof message === 'string') {
        	return message;
        } else if (message.type) {
        	switch (message.type) {
        	case 'incoming': return this.formatIncoming(message);
    		case 'outgoing': return this.formatOutgoing(message);
			case 'forward': return this.formatForward(message);
			default: return '-UNKNOWN STRUCTURED LOG TYPE-';
        	}
        }
        return "-BAD STRUCTURED LOG TYPE (missing 'type')-";
    }

    private formatIncoming(message: StructuredLog): string {
    	const recvr = this.formatIdentifier(message.receiver);
    	const direction = this.formatDirection('>');
    	const separator = this.separator();
    	const msg = this.formatMessage(message.message);
		return `${recvr} ${direction} ${separator} ${msg}`;
    }

    private formatOutgoing(message: StructuredLog): string {
    	const sender = this.formatIdentifier(message.sender);
    	const direction = this.formatDirection('<');
    	const separator = this.separator();
    	const msg = this.formatMessage(message.message);
    	return `${sender} ${direction} ${separator} ${msg}`;
    }

    private formatForward(message: StructuredLog): string {
    	const recvr = this.formatIdentifier(message.receiver);
	   	const direction = this.formatDirection('>');
    	const target = this.formatIdentifier(message.target);
    	const separator = this.separator();
    	const msg = this.formatMessage(message.message);
    	return `${recvr} ${direction} ${target} ${separator} ${msg}`;
    }

	private formatIdentifier(id: string): string {
		return `\x1b[34m${id}\x1b[0m`;
	}

	private formatDirection(indicator: string): string {
		return `\x1b[32m${indicator}\x1b[0m`;
	}

	private separator(): string {
		return `\x1b[36m::\x1b[0m`;
	}

    private formatMessage(message: BaseMessage): string {
		// Compact version
		return `[${message.type}]`;
    }
}