export class MockMediaStreamImpl implements MediaStream {
    active: boolean;
    id: string;

    constructor(data?: MediaStream | MediaStreamTrack[]) {
        //
    }

    onaddtrack: ((this: MediaStream, ev: MediaStreamTrackEvent) => any) | null;
    onremovetrack: ((this: MediaStream, ev: MediaStreamTrackEvent) => any) | null;
    addTrack(track: MediaStreamTrack): void {
        throw new Error("Method not implemented.");
    }
    clone(): MediaStream {
        throw new Error("Method not implemented.");
    }
    getAudioTracks(): MediaStreamTrack[] {
        throw new Error("Method not implemented.");
    }
    getTrackById(trackId: string): MediaStreamTrack | null {
        throw new Error("Method not implemented.");
    }
    getTracks(): MediaStreamTrack[] {
        throw new Error("Method not implemented.");
    }
    getVideoTracks(): MediaStreamTrack[] {
        throw new Error("Method not implemented.");
    }
    removeTrack(track: MediaStreamTrack): void {
        throw new Error("Method not implemented.");
    }
    addEventListener<K extends keyof MediaStreamEventMap>(type: K, listener: (this: MediaStream, ev: MediaStreamEventMap[K]) => any, options?: boolean | AddEventListenerOptions | undefined): void;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions | undefined): void;
    addEventListener(type: unknown, listener: unknown, options?: unknown): void {
        throw new Error("Method not implemented.");
    }
    removeEventListener<K extends keyof MediaStreamEventMap>(type: K, listener: (this: MediaStream, ev: MediaStreamEventMap[K]) => any, options?: boolean | EventListenerOptions | undefined): void;
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions | undefined): void;
    removeEventListener(type: unknown, listener: unknown, options?: unknown): void {
        throw new Error("Method not implemented.");
    }
    dispatchEvent(event: Event): boolean {
        throw new Error("Method not implemented.");
    }

}

export class MockMediaStreamTrackImpl implements MediaStreamTrack {
    contentHint: string;
    enabled: boolean;
    id: string;
    kind: string;
    label: string;
    muted: boolean;
    readyState: MediaStreamTrackState;

    constructor() {
        this.kind = 'video';
        this.readyState = 'live';
    }

    onended: ((this: MediaStreamTrack, ev: Event) => any) | null;
    onmute: ((this: MediaStreamTrack, ev: Event) => any) | null;
    onunmute: ((this: MediaStreamTrack, ev: Event) => any) | null;
    applyConstraints(constraints?: MediaTrackConstraints | undefined): Promise<void> {
        throw new Error("Method not implemented.");
    }
    clone(): MediaStreamTrack {
        throw new Error("Method not implemented.");
    }
    getCapabilities(): MediaTrackCapabilities {
        throw new Error("Method not implemented.");
    }
    getConstraints(): MediaTrackConstraints {
        throw new Error("Method not implemented.");
    }
    getSettings(): MediaTrackSettings {
        throw new Error("Method not implemented.");
    }
    stop(): void {
        throw new Error("Method not implemented.");
    }
    addEventListener<K extends keyof MediaStreamTrackEventMap>(type: K, listener: (this: MediaStreamTrack, ev: MediaStreamTrackEventMap[K]) => any, options?: boolean | AddEventListenerOptions | undefined): void;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions | undefined): void;
    addEventListener(type: unknown, listener: unknown, options?: unknown): void {
        throw new Error("Method not implemented.");
    }
    removeEventListener<K extends keyof MediaStreamTrackEventMap>(type: K, listener: (this: MediaStreamTrack, ev: MediaStreamTrackEventMap[K]) => any, options?: boolean | EventListenerOptions | undefined): void;
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions | undefined): void;
    removeEventListener(type: unknown, listener: unknown, options?: unknown): void {
        throw new Error("Method not implemented.");
    }
    dispatchEvent(event: Event): boolean {
        throw new Error("Method not implemented.");
    }
}

const mockHTMLMediaElementPlay = (ableToPlay: boolean) => {
    if (ableToPlay) {
        return Promise.resolve();
    }
    return Promise.reject("mock cancel");
};

const originalMediaStream = global.MediaStream;
const originalMediaStreamTrack = global.MediaStreamTrack;
export const mockMediaStream = () => {
    global.MediaStream = MockMediaStreamImpl;
    global.MediaStreamTrack = MockMediaStreamTrackImpl;
}

export const unmockMediaStream = () => {
    global.MediaStream = originalMediaStream;
    global.MediaStreamTrack = originalMediaStreamTrack;
}

export const mockHTMLMediaElement = (options: { ableToPlay: boolean, readyState?: number }) => {
    const { ableToPlay, readyState } = options;
    jest.spyOn(HTMLMediaElement.prototype, 'play').mockReturnValue(mockHTMLMediaElementPlay(ableToPlay));
    if (readyState !== undefined) {
        jest.spyOn(HTMLMediaElement.prototype, 'readyState', 'get').mockReturnValue(readyState);
    }
}

