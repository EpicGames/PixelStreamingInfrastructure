// Copyright Epic Games, Inc. All Rights Reserved.

/**
 * Declare additions to base types for cross browser fullscreen functionality.
 */
declare global {
    interface Document {
        webkitIsFullScreen?: boolean;
        mozFullScreen?: boolean;
        webkitFullscreenEnabled?: boolean;
        mozCancelFullScreen?: () => Promise<void>;
        msExitFullscreen?: () => Promise<void>;
        webkitExitFullscreen?: () => Promise<void>;
        mozFullScreenElement?: Element;
        msFullscreenElement?: Element;
        webkitFullscreenElement?: Element;
    }

    interface HTMLElement {
        msRequestFullscreen?: () => Promise<void>;
        mozRequestFullscreen?: () => Promise<void>;
        webkitRequestFullscreen?: () => Promise<void>;
        webkitEnterFullscreen?: () => void;
    }
}

/**
 * Base class for an element (i.e. button) that, when clicked, will toggle fullscreen of a given element.
 * Can be initialized with any HTMLElement, if it is set as rootElement in the constructor.
 */
export class FullScreenIconBase {
    isFullscreen = false;
    fullscreenElement: HTMLElement | HTMLVideoElement;

    _rootElement: HTMLElement;

    public get rootElement() {
        return this._rootElement;
    }

    public set rootElement(element) {
        element.onclick = () => this.toggleFullscreen();
        this._rootElement = element;
    }

    constructor() {       
        // set up the full screen events
        document.addEventListener(
            'webkitfullscreenchange',
            () => this.onFullscreenChange(),
            false
        );
        document.addEventListener(
            'mozfullscreenchange',
            () => this.onFullscreenChange(),
            false
        );
        document.addEventListener(
            'fullscreenchange',
            () => this.onFullscreenChange(),
            false
        );
        document.addEventListener(
            'MSFullscreenChange',
            () => this.onFullscreenChange(),
            false
        );
    }

    /**
     * Makes the document or fullscreenElement fullscreen.
     */
    toggleFullscreen() {
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
            const element = this.fullscreenElement;

            if (!element) {
                return;
            }
            if (element.requestFullscreen) {
                element.requestFullscreen();
            } else if (element.mozRequestFullscreen) {
                element.mozRequestFullscreen();
            } else if (element.webkitRequestFullscreen) {
                element.webkitRequestFullscreen();
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
        this.isFullscreen =
            document.webkitIsFullScreen ||
            document.mozFullScreen ||
            (document.msFullscreenElement &&
                document.msFullscreenElement !== null) ||
            (document.fullscreenElement && document.fullscreenElement !== null);
    }
}

/**
 * An implementation of FullScreenIconBase that uses an externally
 * provided HTMLElement for toggling full screen.
 */
export class FullScreenIconExternal extends FullScreenIconBase {

    constructor(externalButton : HTMLElement) {
        super();
        this.rootElement = externalButton;
    }

}

/**
 * The default fullscreen icon that contains a button and svgs for each state.
 */
export class FullScreenIcon extends FullScreenIconBase {
    _maximizeIcon: SVGElement;
    _minimizeIcon: SVGElement;
    _tooltipText: HTMLElement;

    constructor() {
        super();
        
        const createdButton : HTMLButtonElement = document.createElement('button');
        createdButton.type = 'button';
        createdButton.classList.add('UiTool');
        createdButton.id = 'fullscreen-btn';
        createdButton.appendChild(this.maximizeIcon);
        createdButton.appendChild(this.minimizeIcon);
        createdButton.appendChild(this.tooltipText);

        this.rootElement = createdButton;
    }

    public get tooltipText(): HTMLElement {
        if (!this._tooltipText) {
            this._tooltipText = document.createElement('span');
            this._tooltipText.classList.add('tooltiptext');
            this._tooltipText.innerHTML = 'Fullscreen';
        }
        return this._tooltipText;
    }

    public get maximizeIcon(): SVGElement {
        if (!this._maximizeIcon) {
            this._maximizeIcon = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'svg'
            );
            this._maximizeIcon.setAttributeNS(null, 'id', 'maximizeIcon');
            this._maximizeIcon.setAttributeNS(null, 'x', '0px');
            this._maximizeIcon.setAttributeNS(null, 'y', '0px');
            this._maximizeIcon.setAttributeNS(
                null,
                'viewBox',
                '0 0 384.97 384.97'
            );

            // create svg group for the paths
            const svgGroup = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'g'
            );
            svgGroup.classList.add('svgIcon');
            this._maximizeIcon.appendChild(svgGroup);

            // create paths for the icon itself, one for each corner
            const path1 = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'path'
            );
            path1.setAttributeNS(
                null,
                'd',
                'M384.97,12.03c0-6.713-5.317-12.03-12.03-12.03H264.847c-6.833,0-11.922,5.39-11.934,12.223c0,6.821,5.101,11.838,11.934,11.838h96.062l-0.193,96.519c0,6.833,5.197,12.03,12.03,12.03c6.833-0.012,12.03-5.197,12.03-12.03l0.193-108.369c0-0.036-0.012-0.06-0.012-0.084C384.958,12.09,384.97,12.066,384.97,12.03z'
            );

            const path2 = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'path'
            );
            path2.setAttributeNS(
                null,
                'd',
                'M120.496,0H12.403c-0.036,0-0.06,0.012-0.096,0.012C12.283,0.012,12.247,0,12.223,0C5.51,0,0.192,5.317,0.192,12.03L0,120.399c0,6.833,5.39,11.934,12.223,11.934c6.821,0,11.838-5.101,11.838-11.934l0.192-96.339h96.242c6.833,0,12.03-5.197,12.03-12.03C132.514,5.197,127.317,0,120.496,0z'
            );

            const path3 = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'path'
            );
            path3.setAttributeNS(
                null,
                'd',
                'M120.123,360.909H24.061v-96.242c0-6.833-5.197-12.03-12.03-12.03S0,257.833,0,264.667v108.092c0,0.036,0.012,0.06,0.012,0.084c0,0.036-0.012,0.06-0.012,0.096c0,6.713,5.317,12.03,12.03,12.03h108.092c6.833,0,11.922-5.39,11.934-12.223C132.057,365.926,126.956,360.909,120.123,360.909z'
            );

            const path4 = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'path'
            );
            path4.setAttributeNS(
                null,
                'd',
                'M372.747,252.913c-6.833,0-11.85,5.101-11.838,11.934v96.062h-96.242c-6.833,0-12.03,5.197-12.03,12.03s5.197,12.03,12.03,12.03h108.092c0.036,0,0.06-0.012,0.084-0.012c0.036-0.012,0.06,0.012,0.096,0.012c6.713,0,12.03-5.317,12.03-12.03V264.847C384.97,258.014,379.58,252.913,372.747,252.913z'
            );

            svgGroup.appendChild(path1);
            svgGroup.appendChild(path2);
            svgGroup.appendChild(path3);
            svgGroup.appendChild(path4);
        }
        return this._maximizeIcon;
    }

    public get minimizeIcon(): SVGElement {
        if (!this._minimizeIcon) {
            this._minimizeIcon = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'svg'
            );
            this._minimizeIcon.setAttributeNS(null, 'id', 'minimizeIcon');
            this._minimizeIcon.setAttributeNS(null, 'x', '0px');
            this._minimizeIcon.setAttributeNS(null, 'y', '0px');
            this._minimizeIcon.setAttributeNS(
                null,
                'viewBox',
                '0 0 385.331 385.331'
            );

            // create svg group for the paths
            const svgGroup = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'g'
            );
            svgGroup.classList.add('svgIcon');
            this._minimizeIcon.appendChild(svgGroup);

            // create paths for the icon itself, one for each corner
            const path1 = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'path'
            );
            path1.setAttributeNS(
                null,
                'd',
                'M264.943,156.665h108.273c6.833,0,11.934-5.39,11.934-12.211c0-6.833-5.101-11.85-11.934-11.838h-96.242V36.181c0-6.833-5.197-12.03-12.03-12.03s-12.03,5.197-12.03,12.03v108.273c0,0.036,0.012,0.06,0.012,0.084c0,0.036-0.012,0.06-0.012,0.096C252.913,151.347,258.23,156.677,264.943,156.665z'
            );

            const path2 = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'path'
            );
            path2.setAttributeNS(
                null,
                'd',
                'M120.291,24.247c-6.821,0-11.838,5.113-11.838,11.934v96.242H12.03c-6.833,0-12.03,5.197-12.03,12.03c0,6.833,5.197,12.03,12.03,12.03h108.273c0.036,0,0.06-0.012,0.084-0.012c0.036,0,0.06,0.012,0.096,0.012c6.713,0,12.03-5.317,12.03-12.03V36.181C132.514,29.36,127.124,24.259,120.291,24.247z'
            );

            const path3 = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'path'
            );
            path3.setAttributeNS(
                null,
                'd',
                'M120.387,228.666H12.115c-6.833,0.012-11.934,5.39-11.934,12.223c0,6.833,5.101,11.85,11.934,11.838h96.242v96.423c0,6.833,5.197,12.03,12.03,12.03c6.833,0,12.03-5.197,12.03-12.03V240.877c0-0.036-0.012-0.06-0.012-0.084c0-0.036,0.012-0.06,0.012-0.096C132.418,233.983,127.1,228.666,120.387,228.666z'
            );

            const path4 = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'path'
            );
            path4.setAttributeNS(
                null,
                'd',
                'M373.3,228.666H265.028c-0.036,0-0.06,0.012-0.084,0.012c-0.036,0-0.06-0.012-0.096-0.012c-6.713,0-12.03,5.317-12.03,12.03v108.273c0,6.833,5.39,11.922,12.223,11.934c6.821,0.012,11.838-5.101,11.838-11.922v-96.242H373.3c6.833,0,12.03-5.197,12.03-12.03S380.134,228.678,373.3,228.666z'
            );

            svgGroup.appendChild(path1);
            svgGroup.appendChild(path2);
            svgGroup.appendChild(path3);
            svgGroup.appendChild(path4);
        }
        return this._minimizeIcon;
    }

    onFullscreenChange() {
        super.onFullscreenChange();

        const minimize = this.minimizeIcon;
        const maximize = this.maximizeIcon;

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
