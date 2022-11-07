/**
 * Class for handling fullscreen logic
 */
 export class FullScreenLogic {
	isFullscreen: boolean = false;

	/**
	 * Construct a FullScreenLogic object
	 */
	constructor() {
		document.getElementById("fullscreen-btn").onclick = () => this.fullscreen();

		// set up the full screen events
		document.addEventListener('webkitfullscreenchange', () => this.onFullscreenChange(), false);
		document.addEventListener('mozfullscreenchange', () => this.onFullscreenChange(), false);
		document.addEventListener('fullscreenchange', () => this.onFullscreenChange(), false);
		document.addEventListener('MSFullscreenChange', () => this.onFullscreenChange(), false);
	}

	/**
	 * Makes the document fullscreen 
	 * @returns 
	 */
	fullscreen() {
		// if already full screen; exit
		// else go fullscreen
		if (
			document.fullscreenElement ||
			document.webkitFullscreenElement ||
			document.mozFullScreenElement ||
			document.msFullscreenElement
		) {
			if (document.exitFullscreen) {
				document.exitFullscreen();
			} else if (document.mozCancelFullScreen) {
				document.mozCancelFullScreen();
			} else if (document.webkitExitFullscreen) {
				document.webkitExitFullscreen();
			} else if (document.msExitFullscreen) {
				document.msExitFullscreen();
			}
		} else {
			let element: any;
			//HTML elements controls
			if (!(document.fullscreenEnabled || document.webkitFullscreenEnabled)) {
				element = document.getElementById("streamingVideo") as any;
			} else {
				element = document.getElementById("playerUI") as any;
			}
			if (!element) {
				return;
			}
			if (element.requestFullscreen) {
				element.requestFullscreen();
			} else if (element.mozRequestFullScreen) {
				element.mozRequestFullScreen();
			} else if (element.webkitRequestFullscreen) {
				element.webkitRequestFullscreen((<any>Element).ALLOW_KEYBOARD_INPUT);
			} else if (element.msRequestFullscreen) {
				element.msRequestFullscreen();
			} else if (element.webkitEnterFullscreen) {
				element.webkitEnterFullscreen(); //for iphone this code worked
			}
		}
		this.onFullscreenChange();
	}

	/**
	 * Handles the fullscreen button on change
	 */
	onFullscreenChange() {
		this.isFullscreen = (document.webkitIsFullScreen
			|| document.mozFullScreen
			|| (document.msFullscreenElement && document.msFullscreenElement !== null)
			|| (document.fullscreenElement && document.fullscreenElement !== null));

		let minimize = document.getElementById('minimizeIcon');
		let maximize = document.getElementById('maximizeIcon');
		if (minimize && maximize) {
			if (this.isFullscreen) {
				minimize.style.display = 'inline';
				//ios disappearing svg fix
				minimize.style.transform = 'translate(0, 0)';
				maximize.style.display = 'none';
			} else {
				minimize.style.display = 'none';
				maximize.style.display = 'inline';
				//ios disappearing svg fix
				maximize.style.transform = 'translate(0, 0)';
			}
		}
	}

}