import { jsonc } from 'jsonc';
import { BaseMessage } from '@epicgames-ps/lib-pixelstreamingcommon-ue5.5';

/**
 * Cirular reference safe version of JSON.stringify
 */
export function stringify(obj: any): string {
	return jsonc.stringify(obj);
}

/**
 * Circular reference save version of JSON.stringify with extra formatting.
 */
export function beautify(obj: any): string {
	return jsonc.stringify(obj, undefined, '\t');
}
