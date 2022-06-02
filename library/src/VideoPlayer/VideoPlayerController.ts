import { MouseController } from "../Inputs/MouseController"
import { IVideoPlayerMouseInterface } from "./VideoPlayerMouseInterface";
import { UeDescriptorUi } from "../UeInstanceMessage/UeDescriptorUi";
import { Logger } from "../Logger/Logger";
import { IVideoPlayer } from "./IVideoPlayer";

/**
 * Video Player Controller handles the creation of the video HTML element and all handlers
 */
export class VideoPlayerController {
    videoElementProvider: IVideoPlayer;
    audioElement: HTMLAudioElement;
    mouseController: MouseController;
    ueDescriptorUi: UeDescriptorUi;
    onUpdatePosition: (mouseEvent: MouseEvent) => void;
    videoInputBindings: IVideoPlayerMouseInterface;

    constructor(videoElementProvider: IVideoPlayer) {
        this.videoElementProvider = videoElementProvider;
        this.audioElement = document.createElement("Audio") as HTMLAudioElement;
    }

    /**
     * Create the video Element
     */
    setUpMouseHandlerEvents() {
        let videoElement = this.videoElementProvider.getVideoElement();
        videoElement.onmouseenter = (event: MouseEvent) => this.handleMouseEnter(event);
        videoElement.onmouseleave = (event: MouseEvent) => this.handleMouseLeave(event);
    }

    /**
     * Handle when the locked state Changed
     */
    handleLockStateChange() {
        Logger.verboseLog("Lock state has changed");
        let videoElement = this.videoElementProvider.getVideoElement();
        if (document.pointerLockElement === videoElement /*document.mozPointerLockElement === playerElement*/) {
            document.onmousemove = this.videoInputBindings.handleMouseMove.bind(this.videoInputBindings);
            document.onwheel = this.videoInputBindings.handleMouseWheel.bind(this.videoInputBindings);
            videoElement.onmousedown = this.videoInputBindings.handleMouseDown.bind(this.videoInputBindings);
            videoElement.onmouseup = this.videoInputBindings.handleMouseUp.bind(this.videoInputBindings);
        } else {
            document.onmousemove = null;
            videoElement.onmousedown = null;
            videoElement.onmouseup = null;
            videoElement.onwheel = null;
        }
    }

    /**
     * Handle when the Element is mouse clicked
     * @param event - Mouse Event
     */
    handleClick(event: MouseEvent) {
        let videoElement = this.videoElementProvider.getVideoElement();
        if (videoElement.paused) {
            videoElement.play();
        }
        videoElement.requestPointerLock();
    }

    /**
     * Handle when the Mouse has entered the element
     * @param event - Mouse Event
     */
    handleMouseEnter(event: MouseEvent) {
        Logger.verboseLog("Mouse Entered");
        this.mouseController.sendMouseEnter();
    }

    /**
     * Handles when the mouse has left the element 
     * @param event - Mouse event
     */
    handleMouseLeave(event: MouseEvent) {
        Logger.verboseLog("Mouse Left");
        this.mouseController.sendMouseLeave();
    }

    /**
     * Handles the Load Meta Data Event
     * @param event - Event Not used
     */
    handleLoadMetaData(event: Event) {
        Logger.verboseLog("showPlayOverlay \n resizePlayerStyle");
    }

    /**
     * Handles when the Peer connection has a track event
     * @param rtcTrackEvent - RTC Track Event 
     */
    handleOnTrack(rtcTrackEvent: RTCTrackEvent) {
        Logger.verboseLog("handleOnTrack " + JSON.stringify(rtcTrackEvent.streams));
        let videoElement = this.videoElementProvider.getVideoElement();

        if (rtcTrackEvent.track) {
            Logger.verboseLog('Got track - ' + rtcTrackEvent.track.kind + ' id=' + rtcTrackEvent.track.id + ' readyState=' + rtcTrackEvent.track.readyState);
        }

        if (rtcTrackEvent.track.kind == "audio") {
            this.CreateAudioTrack(rtcTrackEvent.streams[0]);
            return;
        } else if (rtcTrackEvent.track.kind == "video" && videoElement.srcObject !== rtcTrackEvent.streams[0]) {
            videoElement.srcObject = rtcTrackEvent.streams[0];
            console.log('Set video source from video track ontrack.');
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
            console.log('Created new audio element to play separate audio stream.');
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
            console.log(onRejectedReason);
            console.log("Browser does not support autoplaying audio without interaction - to resolve this we are going to run the audio until the video is clicked");

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
        let videoElement = this.videoElementProvider.getVideoElement();
        videoElement.srcObject.getTracks().forEach((track: MediaStreamTrack) => track.enabled = enabled);
    }

}

/* 5457524F4D4D */