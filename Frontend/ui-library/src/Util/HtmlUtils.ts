// Copyright Epic Games, Inc. All Rights Reserved.

export class HtmlUtils {
    /**
     * Escapes a string so it is displayed as text when inserted into HTML. Use this for any value that
     * comes from the URL, the signalling server or a streamer before it is placed in an overlay message,
     * since the overlays render their text as HTML.
     * @param text - the untrusted text to escape
     */
    static escape(text: string): string {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}
