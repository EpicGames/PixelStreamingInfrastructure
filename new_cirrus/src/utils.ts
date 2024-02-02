import { jsonc } from 'jsonc';

export function stringify(obj: any): string {
	return jsonc.stringify(obj);
}

export function beautify(obj: any): string {
	return jsonc.stringify(obj, undefined, '\t');
}
