import { jsonc } from 'jsonc';
import { BaseMessage } from '@epicgames-ps/lib-pixelstreamingcommon-ue5.5';
import { Logger } from './logger';

export function stringify(obj: any): string {
	return jsonc.stringify(obj);
}

export function beautify(obj: any): string {
	return jsonc.stringify(obj, undefined, '\t');
}
