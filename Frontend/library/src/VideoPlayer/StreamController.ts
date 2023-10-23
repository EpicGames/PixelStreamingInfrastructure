// Copyright Epic Games, Inc. All Rights Reserved.

import { MouseController } from '../Inputs/MouseController';
import { Logger } from '../Logger/Logger';
import { VideoPlayer } from './VideoPlayer';

/**
 * Video Player Controller handles the creation of the video HTML element and all handlers
 */
export class StreamController {
    videoElementProvider: VideoPlayer;
    audioElement: HTMLAudioElement;
    mouseController: MouseController;

    /**
     * @param videoElementProvider Video Player instance
     */
    constructor(videoElementProvider: VideoPlayer) {
        this.videoElementProvider = videoElementProvider;
        this.audioElement = document.createElement('Audio') as HTMLAudioElement;
        this.videoElementProvider.setAudioElement(this.audioElement);
    }

    /**
     * Handles when the Peer connection has a track event
     * @param rtcTrackEvent - RTC Track Event
     */
    handleOnTrack(rtcTrackEvent: RTCTrackEvent) {
        Logger.Log(
            Logger.GetStackTrace(),
            'handleOnTrack ' + JSON.stringify(rtcTrackEvent.streams),
            6
        );
        const videoElement = this.videoElementProvider.getVideoElement();

        if (rtcTrackEvent.track) {
            Logger.Log(
                Logger.GetStackTrace(),
                'Got track - ' +
                    rtcTrackEvent.track.kind +
                    ' id=' +
                    rtcTrackEvent.track.id +
                    ' readyState=' +
                    rtcTrackEvent.track.readyState,
                6
            );
        }

        if (rtcTrackEvent.track.kind == 'audio') {
            this.CreateAudioTrack(rtcTrackEvent.streams[0]);
            return;
        } else if (
            rtcTrackEvent.track.kind == 'video' &&
            videoElement.srcObject !== rtcTrackEvent.streams[0]
        ) {
            videoElement.srcObject = rtcTrackEvent.streams[0];
            Logger.Log(
                Logger.GetStackTrace(),
                'Set video source from video track ontrack.'
            );
            return;
        }
    }

    /**
     * Creates the audio device when receiving an RTCTrackEvent with the kind of "audio"
     * @param audioMediaStream - Audio Media stream track
     */
    CreateAudioTrack(audioMediaStream: MediaStream) {
        const videoElement = this.videoElementProvider.getVideoElement();

        // do nothing the video has the same media stream as the audio track we have here (they are linked)
        if (videoElement.srcObject == audioMediaStream) {
            return;
        }
        // video element has some other media stream that is not associated with this audio track
        else if (
            videoElement.srcObject &&
            videoElement.srcObject !== audioMediaStream
        ) {
            // create a new audio element
            this.audioElement.srcObject = audioMediaStream;
            Logger.Log(
                Logger.GetStackTrace(),
                'Created new audio element to play separate audio stream.'
            );
        }
    }
}
