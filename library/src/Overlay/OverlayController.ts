import { Images } from "./Images";
/**This controller should be created in your Noop Delegate and accessed in WebRtcPlayerController through the Delegate interface*/
export class OverlayController {
    shouldShowPlayOverlay = true;
    playerDiv: HTMLDivElement;
    playButtonImage: string;

    constructor(playerDiv: HTMLDivElement) {
        this.playerDiv = playerDiv;
    }

    /**
     * Create a clickable div with text and onclick functions
     * @param htmlClass the html class you are applying 
     * @param htmlElement the created html element you are applying
     * @param onClickFunction the event listener you are applying to your custom element     
     */
    setOverlay(htmlClass?: string, htmlElement?: HTMLElement, onClickFunction?: EventListener, progress?: number) {
        // videoPlayOverlay is made dynamically so it is left as is
        var videoPlayOverlay = document.getElementById('videoPlayOverlay') as HTMLDivElement;
        if (!videoPlayOverlay) {
            //var playerDiv = document.getElementById('player');
            videoPlayOverlay = document.createElement('div');
            videoPlayOverlay.id = 'videoPlayOverlay';
            this.playerDiv.appendChild(videoPlayOverlay);
        }

        // Remove existing html child elements so we can add the new one
        while (videoPlayOverlay.lastChild) {
            videoPlayOverlay.removeChild(videoPlayOverlay.lastChild);
        }

        if (htmlElement) {

            // add a progress bar if the progress is given currently unused leaving here in case
            // if (progress !== undefined) {
            //     let progressBar: HTMLElement = document.createElement('div');
            //     progressBar.className = 'progress'
            //     let progressBarInner: HTMLElement = document.createElement('div');
            //     progressBarInner.className = 'progress-bar progress-bar-striped active'
            //     progressBarInner.style.width = progress + "%"
            //     progressBar.appendChild(progressBarInner);
            //     htmlElement.appendChild(progressBar);
            // }

            // add a spinner 
            if (progress !== undefined) {
                let spinnerSpan: HTMLSpanElement = document.createElement('span');
                spinnerSpan.className = "visually-hidden"
                spinnerSpan.innerHTML = "Loading..."

                let spinnerDiv: HTMLDivElement = document.createElement('div');
                spinnerDiv.id = "loading-spinner"
                spinnerDiv.className = "spinner-border ms-2"
                spinnerDiv.setAttribute("role", "status");

                spinnerDiv.appendChild(spinnerSpan);
                htmlElement.appendChild(spinnerDiv);
            }

            videoPlayOverlay.appendChild(htmlElement);
        }

        if (onClickFunction) {
            videoPlayOverlay.addEventListener('click', function onOverlayClick(event: Event) {
                onClickFunction(event);
                videoPlayOverlay.removeEventListener('click', onOverlayClick);
            });
        }

        // Remove existing html classes so we can set the new one
        let cl = videoPlayOverlay.classList;
        for (let i = cl.length - 1; i >= 0; i--) {
            cl.remove(cl[i]);
        }

        videoPlayOverlay.classList.add(htmlClass);
    }

    /**
    * Create a text overlay 
    * @param text the text you want your text overlay to display
    */
    showTextOverlay(text: string, progress?: number) {
        let textOverlay = document.createElement('div');
        textOverlay.id = 'messageOverlay';
        textOverlay.innerHTML = text ? text : '';
        this.setOverlay('textDisplayState', textOverlay, undefined, progress);
    }

    //to show the connect overlay the overlay Event listener must be preset and passed in
    /**
     * shows the starting connect overlay
     * @param event the event listener you want to activate when you click this overlay
     */
    showConnectOverlay(event: EventListener) {
        let startText = document.createElement('div');
        startText.id = 'playButton';
        startText.innerHTML = 'Click to start';
        this.setOverlay('clickableState', startText, event);
    }

    /**
    * shows the play overlay
    *  @param event the event listener you want to activate when you click this overlay
    */
    showPlayOverlay(event: EventListener) {
        let img = document.createElement('img');
        img.id = 'playButton';
        img.src = Images.playButton;
        img.alt = 'Start Streaming';
        this.setOverlay('clickableState', img, event);
        this.shouldShowPlayOverlay = false;
    }

    /**
    * hide the overlay
    */
    hideOverlay() {
        this.setOverlay('hiddenState');
    }
}