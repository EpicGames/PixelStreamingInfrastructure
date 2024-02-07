import { jsonc } from 'jsonc';
import { BaseMessage } from '@epicgames-ps/lib-pixelstreamingcommon-ue5.5';

export function stringify(obj: any): string {
	return jsonc.stringify(obj);
}

export function beautify(obj: any): string {
	return jsonc.stringify(obj, undefined, '\t');
}
