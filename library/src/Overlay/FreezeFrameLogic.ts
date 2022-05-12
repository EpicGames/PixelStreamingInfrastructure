import { UeControlMessage } from "../UeInstanceMessage/UeControlMessage";
import { IOverlay } from "./IOverlay";

export class FreezeFrameLogic {
    freezeFrameOverlay: HTMLDivElement;
    freezeFrameImage: HTMLImageElement;
    freezeFrame: FreezeFrame;
    ueControlMessage: UeControlMessage;
    IOverlay: IOverlay;
    player: HTMLDivElement;
    enlargeDisplayToFillWindowInput: HTMLInputElement;

    constructor(player: HTMLDivElement, enlargeDisplayToFillWindowInput?: HTMLInputElement) {
        this.freezeFrame = new FreezeFrame();
        this.player = player;
        this.enlargeDisplayToFillWindowInput = enlargeDisplayToFillWindowInput;
    }

    /**
	 * Override for checking if the video is enabled 
	 */ 
    setVideoEnabled(enabled: boolean){}
    
    /**
	 * Override for checking if the videoPlayer exists
	 */ 
    checkIfVideoExists(){}
    
    /**
	 * Override for calling resizePlayerStyle from the UiController
	 */ 
    resizePlayerStyle(){}

    /**
	 * setup and append the freezeFrame element
	 */ 
    setupFreezeFrameOverlay() {
        // create the overlay
        this.freezeFrameOverlay = document.createElement('div');
        this.freezeFrameOverlay.id = 'freezeFrameOverlay';
        this.freezeFrameOverlay.style.display = 'none';
        this.freezeFrameOverlay.style.pointerEvents = 'none';
        this.freezeFrameOverlay.style.position = 'absolute';
        this.freezeFrameOverlay.style.zIndex = '20';
        this.player.appendChild(this.freezeFrameOverlay);

        // create the image place holder
        this.freezeFrameImage = document.createElement('img');
        this.freezeFrameImage.style.position = 'absolute';
        this.freezeFrameOverlay.appendChild(this.freezeFrameImage);

    }

    /**
	 * resize the freezeFrame accordingly with the screen size
	 */ 
    resizeFreezeFrameOverlay() {
        if (this.freezeFrame.width !== 0 && this.freezeFrame.height !== 0) {
            let displayWidth = 0;
            let displayHeight = 0;
            let displayTop = 0;
            let displayLeft = 0;
            let checkBox = this.enlargeDisplayToFillWindowInput;
            if (checkBox === undefined || (checkBox !== null && checkBox.checked)) {
                let windowAspectRatio = window.innerWidth / window.innerHeight;
                let videoAspectRatio = this.freezeFrame.width / this.freezeFrame.height;
                if (windowAspectRatio < videoAspectRatio) {
                    displayWidth = window.innerWidth;
                    displayHeight = Math.floor(window.innerWidth / videoAspectRatio);
                    displayTop = Math.floor((window.innerHeight - displayHeight) * 0.5);
                    displayLeft = 0;
                } else {
                    displayWidth = Math.floor(window.innerHeight * videoAspectRatio);
                    displayHeight = window.innerHeight;
                    displayTop = 0;
                    displayLeft = Math.floor((window.innerWidth - displayWidth) * 0.5);
                }
            } else {
                // Video is coming in at native resolution, we care more about the player size
                let playerAspectRatio = this.player.offsetWidth / this.player.offsetHeight;
                let videoAspectRatio = this.freezeFrame.width / this.freezeFrame.height;
                if (playerAspectRatio < videoAspectRatio) {
                    displayWidth = this.player.offsetWidth;
                    displayHeight = Math.floor(this.player.offsetWidth / videoAspectRatio);
                    displayTop = Math.floor((this.player.offsetHeight - displayHeight) * 0.5);
                    displayLeft = 0;
                } else {
                    displayWidth = Math.floor(this.player.offsetHeight * videoAspectRatio);
                    displayHeight = this.player.offsetHeight;
                    displayTop = 0;
                    displayLeft = Math.floor((this.player.offsetWidth - displayWidth) * 0.5);
                }
            }
            this.freezeFrameOverlay.style.width = this.player.offsetWidth + 'px';
            this.freezeFrameOverlay.style.height = this.player.offsetHeight + 'px';
            this.freezeFrameOverlay.style.left = 0 + 'px';
            this.freezeFrameOverlay.style.top = 0 + 'px';

            this.freezeFrameImage.style.width = displayWidth + 'px';
            this.freezeFrameImage.style.height = displayHeight + 'px';
            this.freezeFrameImage.style.left = displayLeft + 'px';
            this.freezeFrameImage.style.top = displayTop + 'px';
        }
    }

     /**
	 * when we receive a freezeFrame process the byte array data 
	 */ 
    processFreezeFrameMessage(view: Uint8Array) {
		// Reset freeze frame if we got a freeze frame message and we are not "receiving" yet.
		if(!this.freezeFrame.receiving) {
			this.freezeFrame.receiving = true;
			this.freezeFrame.valid = false;
			this.freezeFrame.size = 0;
			this.freezeFrame.jpeg = undefined;
		}

		// Extract total size of freeze frame (across all chunks)
		this.freezeFrame.size = (new DataView(view.slice(1, 5).buffer)).getInt32(0, true);

		// Get the jpeg part of the payload
		let jpegBytes = view.slice(1 + 4);

		// Append to existing jpeg that holds the freeze frame
		if(this.freezeFrame.jpeg) {
			let jpeg = new Uint8Array(this.freezeFrame.jpeg.length + jpegBytes.length);
			jpeg.set(this.freezeFrame.jpeg, 0);
			jpeg.set(jpegBytes, this.freezeFrame.jpeg.length);
			this.freezeFrame.jpeg = jpeg;
		}
		// No existing freeze frame jpeg, make one
		else {
			this.freezeFrame.jpeg = jpegBytes;
			this.freezeFrame.receiving = true;
			console.log(`received first chunk of freeze frame: ${this.freezeFrame.jpeg.length}/${this.freezeFrame.size}`);
		}
		
		// Uncomment for debug
		//console.log(`Received freeze frame chunk: ${freezeFrame.jpeg.length}/${freezeFrame.size}`);

		// Finished receiving freeze frame, we can show it now
		if (this.freezeFrame.jpeg.length === this.freezeFrame.size) {
			this.freezeFrame.receiving = false;
			this.freezeFrame.valid = true;
			console.log(`received complete freeze frame ${this.freezeFrame.size}`);
			this.showFreezeFrame();
		}
		// We received more data than the freeze frame payload message indicate (this is an error)
		else if (this.freezeFrame.jpeg.length > this.freezeFrame.size) {
			console.error(`received bigger freeze frame than advertised: ${this.freezeFrame.jpeg.length}/${this.freezeFrame.size}`);
			this.freezeFrame.jpeg = undefined;
			this.freezeFrame.receiving = false;
		}
	}

     /**
	 * show the freezeFrame overlay 
	 */ 
    showFreezeFrameOverlay() {
        if (this.freezeFrame.valid) {
            this.freezeFrameOverlay.classList.add("freezeframeBackground");
            this.freezeFrameOverlay.style.display = 'block';
        }
    }

     /**
	 * Remove and hide the freezeFrame overlay 
	 */ 
    invalidateFreezeFrameOverlay() {
        this.freezeFrameOverlay.style.display = 'none';
        this.freezeFrame.valid = false;
        this.freezeFrameOverlay.classList.remove("freezeframeBackground");
        if(this.checkIfVideoExists){
            this.setVideoEnabled(true);
        }
    }

    /**
	 * Show the actual freeze frame Image from the byte array data  
	 */ 
    showFreezeFrame() {
        let base64 = btoa(this.freezeFrame.jpeg.reduce((data, byte) => data + String.fromCharCode(byte), ''));
        this.freezeFrameImage.src = 'data:image/jpeg;base64,' + base64;
        this.freezeFrameImage.onload = function () {
            this.freezeFrame.height = this.freezeFrameImage.naturalHeight;
            this.freezeFrame.width = this.freezeFrameImage.naturalWidth;
            this.resizeFreezeFrameOverlay();
            if (this.IOverlay.shouldShowPlayOverlay === true) {
                console.log("showing play overlay")
                this.IOverlay.showPlayOverlay();
                this.resizePlayerStyle();
            } else {
                console.log("showing freeze frame")
                this.showFreezeFrameOverlay();
            }
            this.setVideoEnabled(false);
        }.bind(this);
    }

}

export class FreezeFrame {
    receiving = false;
    size = 0;
    jpeg: Uint8Array = undefined;
    height = 0;
    width = 0;
    valid = false;
}