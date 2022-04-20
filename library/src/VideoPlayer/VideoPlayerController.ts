import { MouseController } from "../Inputs/MouseController"
import { IVideoPlayerMouseInterface } from "./VideoPlayerMouseInterface";
import { UeDescriptorUi } from "../UeInstanceMessage/UeDescriptorUi";
import { Logger } from "../Logger/Logger";

/**
 * Video Player Controller handles the creation of the video HTML element and all handlers
 */
export class VideoPlayerController {
    videoPlayerDiv: HTMLDivElement;
    videoElement: any;
    mouseController: MouseController;
    ueDescriptorUi: UeDescriptorUi;
    onUpdatePosition: (mouseEvent: MouseEvent) => void;
    videoInputBindings: IVideoPlayerMouseInterface;
    startVideoMuted: boolean;
    autoPlayAudio: boolean;

    constructor(htmlDivElement: HTMLDivElement, startVideoMuted: boolean, autoPlayAudio: boolean) {
        // set the audio defaults
        this.startVideoMuted = startVideoMuted;
        this.autoPlayAudio = autoPlayAudio;

        // the video element needs to exist before creating the player so assign the div and make the element
        this.videoPlayerDiv = htmlDivElement;
        this.videoElement = document.createElement("video");
    }

    /**
     * Create the video Element
     */
    createVideoPlayer() {
        this.videoElement.id = "streamingVideo";
        this.videoElement.muted = this.startVideoMuted;
        this.videoElement.disablePictureInPicture = true;
        this.videoElement.playsInline = true;
        this.videoElement.style.width = "100%";
        this.videoElement.style.height = "100%";
        this.videoElement.onmouseenter = this.handleMouseEnter.bind(this);
        this.videoElement.onmouseleave = this.handleMouseLeave.bind(this);
        this.videoPlayerDiv.appendChild(this.videoElement);
    }

    /**
     * Handle when the locked state Changed
     */
    handleLockStateChange() {
        Logger.verboseLog("Lock state has changed");
        if (document.pointerLockElement === this.videoElement /*document.mozPointerLockElement === playerElement*/) {
            document.onmousemove = this.videoInputBindings.handleMouseMove.bind(this.videoInputBindings);
            document.onwheel = this.videoInputBindings.handleMouseWheel.bind(this.videoInputBindings);
            this.videoElement.onmousedown = this.videoInputBindings.handleMouseDown.bind(this.videoInputBindings);
            this.videoElement.onmouseup = this.videoInputBindings.handleMouseUp.bind(this.videoInputBindings);
        } else {
            document.onmousemove = null;
            this.videoElement.onmousedown = null;
            this.videoElement.onmouseup = null;

            this.videoElement.onwheel = null;
        }
    }

    /**
     * Handle when the Element is mouse clicked
     * @param event - Mouse Event
     */
    handleClick(event: MouseEvent) {
        if (this.videoElement.paused) {
            this.videoElement.play();
        }
        this.videoElement.requestPointerLock();
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

        if (rtcTrackEvent.track) {
            Logger.verboseLog('Got track - ' + rtcTrackEvent.track.kind + ' id=' + rtcTrackEvent.track.id + ' readyState=' + rtcTrackEvent.track.readyState);
        }

        if (rtcTrackEvent.track.kind == "audio") {
            this.handleOnAudioTrack(rtcTrackEvent.streams[0]);
            return;
        } else if (rtcTrackEvent.track.kind == "video" && this.videoElement.srcObject !== rtcTrackEvent.streams[0]) {
            this.videoElement.srcObject = rtcTrackEvent.streams[0];
            console.log('Set video source from video track ontrack.');
            return;
        }
    }

    /**
    * Handles when receiving an RTCTrackEvent with the kind of "audio"
    * @param audioMediaStream - Audio Media stream track
    */
    handleOnAudioTrack(audioMediaStream: MediaStream) {
        // do nothing the video has the same media stream as the audio track we have here (they are linked)
        if (this.videoElement.srcObject == audioMediaStream) {
            return;
        }
        // video element has some other media stream that is not associated with this audio track
        else if (this.videoElement.srcObject && this.videoElement.srcObject !== audioMediaStream) {
            // create a new audio element
            // had to assign any type as cannot assign type MediaStreamTrack to html element may change soon 
            let audioElem = document.createElement("Audio") as HTMLAudioElement;
            audioElem.srcObject = audioMediaStream;

            // there is no way to autoplay audio (even muted), so we defer audio until first click
            if (this.autoPlayAudio === false) {

                let clickToPlayAudio = () => {
                    audioElem.play();
                    this.videoElement.removeEventListener("click", clickToPlayAudio);
                };

                this.videoElement.addEventListener("click", clickToPlayAudio);
            }
            // we assume the user has clicked somewhere on the page and autoplaying audio will work
            else {
                audioElem.play();
            }
            console.log('Created new audio element to play separate audio stream.');
        }
    }

    /**
     * Set the Video Elements src object tracks to enable
     * @param enabled - Enable Tracks on the Src Object
     */
    setVideoEnabled(enabled: boolean) {
        this.videoElement.srcObject.getTracks().forEach((track: MediaStreamTrack) => track.enabled = enabled);
    }

}

/* 5457524F4D4D */