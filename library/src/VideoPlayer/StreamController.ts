import { MouseController } from "../Inputs/MouseController"
import { Logger } from "../Logger/Logger";
import { IVideoPlayer } from "./IVideoPlayer";

/**
 * Video Player Controller handles the creation of the video HTML element and all handlers
 */
export class StreamController {
    videoElementProvider: IVideoPlayer;
    audioElement: HTMLAudioElement;
    mouseController: MouseController;

    constructor(videoElementProvider: IVideoPlayer) {
        this.videoElementProvider = videoElementProvider;
        this.audioElement = document.createElement("Audio") as HTMLAudioElement;
    }

    /**
     * Handles when the Peer connection has a track event
     * @param rtcTrackEvent - RTC Track Event 
     */
    handleOnTrack(rtcTrackEvent: RTCTrackEvent) {
        Logger.Log(Logger.GetStackTrace(), "handleOnTrack " + JSON.stringify(rtcTrackEvent.streams), 6);
        let videoElement = this.videoElementProvider.getVideoElement();

        if (rtcTrackEvent.track) {
            Logger.Log(Logger.GetStackTrace(), 'Got track - ' + rtcTrackEvent.track.kind + ' id=' + rtcTrackEvent.track.id + ' readyState=' + rtcTrackEvent.track.readyState, 6);
        }

        if (rtcTrackEvent.track.kind == "audio") {
            this.CreateAudioTrack(rtcTrackEvent.streams[0]);
            return;
        } else if (rtcTrackEvent.track.kind == "video" && videoElement.srcObject !== rtcTrackEvent.streams[0]) {
            videoElement.srcObject = rtcTrackEvent.streams[0];
            Logger.Log(Logger.GetStackTrace(), 'Set video source from video track ontrack.',);
            return;
        }
    }

    /**
    * Creates the audio device when receiving an RTCTrackEvent with the kind of "audio"
    * @param audioMediaStream - Audio Media stream track
    */
    CreateAudioTrack(audioMediaStream: MediaStream) {
        let videoElement = this.videoElementProvider.getVideoElement();

        // do nothing the video has the same media stream as the audio track we have here (they are linked)
        if (videoElement.srcObject == audioMediaStream) {
            return;
        }
        // video element has some other media stream that is not associated with this audio track
        else if (videoElement.srcObject && videoElement.srcObject !== audioMediaStream) {
            // create a new audio element
            this.audioElement.srcObject = audioMediaStream;
            Logger.Log(Logger.GetStackTrace(), 'Created new audio element to play separate audio stream.',);
        }
    }

    /**
     * Plays the audio from the audio element or sets up an event listener to play it once an interaction has occurred 
     */
    PlayAudioTrack() {
        let videoElement = this.videoElementProvider.getVideoElement();

        // attempt to auto play the audio from the audio element if not then set up a listener 
        this.audioElement.muted = false;
        this.audioElement.play().catch((onRejectedReason: string) => {
            Logger.Info(Logger.GetStackTrace(), onRejectedReason);
            Logger.Info(Logger.GetStackTrace(), "Browser does not support autoplaying audio without interaction - to resolve this we are going to run the audio until the video is clicked");

            let clickToPlayAudio = () => {
                this.audioElement.muted = false;
                this.audioElement.play();
                videoElement.removeEventListener("click", clickToPlayAudio);
            };

            videoElement.addEventListener("click", clickToPlayAudio);
        });
    }

    /**
     * Set the Video Elements src object tracks to enable
     * @param enabled - Enable Tracks on the Src Object
     */
    setVideoEnabled(enabled: boolean) {
        // this is a temporary hack until type scripts video element is updated to reflect the need for tracks on a html video element 
        let videoElement = this.videoElementProvider.getVideoElement() as any;
        videoElement.srcObject.getTracks().forEach((track: MediaStreamTrack) => track.enabled = enabled);
    }

}

/* 5457524F4D4D */