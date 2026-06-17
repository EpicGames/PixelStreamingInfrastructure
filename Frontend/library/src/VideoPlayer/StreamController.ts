// Copyright Epic Games, Inc. All Rights Reserved.

import { Logger } from '@epicgames-ps/lib-pixelstreamingcommon-ue5.7';
import { VideoPlayer } from './VideoPlayer';

/**
 * Video Player Controller handles the creation of the video HTML element and all handlers
 */
export class StreamController {
    videoElementProvider: VideoPlayer;
    audioElement: HTMLAudioElement;

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
        Logger.Info('handleOnTrack ' + JSON.stringify(rtcTrackEvent.streams));
        // Do not add the track if the ID is `probator` as this is special track created by mediasoup for bitrate probing.
        // Refer to https://github.com/EpicGames/PixelStreamingInfrastructure/pull/86 for more details.
        if (rtcTrackEvent.streams.length < 1 || rtcTrackEvent.streams[0].id === 'probator') {
            return;
        }

        const videoElement = this.videoElementProvider.getVideoElement();

        if (rtcTrackEvent.track) {
            Logger.Info(
                'Got track - ' +
                    rtcTrackEvent.track.kind +
                    ' id=' +
                    rtcTrackEvent.track.id +
                    ' readyState=' +
                    rtcTrackEvent.track.readyState
            );
        }

        if (rtcTrackEvent.track.kind === 'audio') {
            this.CreateAudioTrack(rtcTrackEvent.streams[0]);
            return;
        } else if (
            rtcTrackEvent.track.kind === 'video' &&
            videoElement.srcObject !== rtcTrackEvent.streams[0]
        ) {
            videoElement.srcObject = rtcTrackEvent.streams[0];
            Logger.Info('Set video source from video track ontrack.');
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
        else if (videoElement.srcObject && videoElement.srcObject !== audioMediaStream) {
            // create a new audio element
            this.audioElement.srcObject = audioMediaStream;
            Logger.Info('Created new audio element to play separate audio stream.');
        }
    }
}
