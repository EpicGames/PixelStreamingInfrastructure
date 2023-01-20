// Copyright Epic Games, Inc. All Rights Reserved.

/**
 * A UI element showing the QP (quantization parameter) of the video stream at the last encoded frame (well, last transmitted QP really).
 * A blockier encoding will have a higher QP and this will make the indicator turn more red.
 * A non-blocky stream will have a lower QP and this will make the indicator turn more green.
 * The QP indicator is represented visually using a WiFi icon.
 */
export class VideoQpIndicator {
    videoEncoderAvgQP = -1;

    // non html elements
    statsText = '';
    color = '';

    // qp colors
    readonly orangeQP = 26;
    readonly redQP = 35;

    _rootElement: HTMLElement;
    _qualityText: HTMLElement;
    _qualityStatus: SVGElement;
    _dot: SVGElement;
    _outer: SVGElement;
    _middle: SVGElement;
    _inner: SVGElement;

    /**
     * Get the root element of the QP indicator.
     */
    public get rootElement(): HTMLElement {
        if (!this._rootElement) {
            // make the root element that contains the svg for the connection
            this._rootElement = document.createElement('div');
            this._rootElement.id = 'connection';
            this._rootElement.classList.add('UiTool');

            // add svg icon for the connection strength
            this._rootElement.appendChild(this.qualityStatus);

            // add the text underneath the connection
            this._rootElement.appendChild(this.qualityText);

            // set colors to not connected initially
            this.updateQpTooltip(-1);
        }
        return this._rootElement;
    }

    /**
     * Get the text that displays under the icon.
     */
    public get qualityText(): HTMLElement {
        if (!this._qualityText) {
            this._qualityText = document.createElement('span');
            this._qualityText.id = 'qualityText';
            this._qualityText.classList.add('tooltiptext');
        }
        return this._qualityText;
    }

    /**
     * Get the icon.
     */
    public get qualityStatus(): SVGElement {
        if (!this._qualityStatus) {
            this._qualityStatus = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'svg'
            );
            this._qualityStatus.setAttributeNS(
                null,
                'id',
                'connectionStrength'
            );
            this._qualityStatus.setAttributeNS(null, 'x', '0px');
            this._qualityStatus.setAttributeNS(null, 'y', '0px');
            this._qualityStatus.setAttributeNS(
                null,
                'viewBox',
                '0 0 494.45 494.45'
            );

            // build wifi icon
            this.qualityStatus.appendChild(this.dot);
            this.qualityStatus.appendChild(this.middle);
            this.qualityStatus.appendChild(this.outer);
            this.qualityStatus.appendChild(this.inner);
        }
        return this._qualityStatus;
    }

    /**
     * Get the dot at the bottom of the wifi icon.
     */
    public get dot(): SVGElement {
        if (!this._dot) {
            this._dot = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'circle'
            );
            this._dot.setAttributeNS(null, 'id', 'dot');
            this._dot.setAttributeNS(null, 'cx', '247.125');
            this._dot.setAttributeNS(null, 'cy', '398.925');
            this._dot.setAttributeNS(null, 'r', '35.3');
        }
        return this._dot;
    }

    /**
     * Get the outer arc of the wifi icon.
     */
    public get outer(): SVGElement {
        if (!this._outer) {
            this._outer = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'path'
            );
            this._outer.setAttributeNS(null, 'id', 'outer');
            this._outer.setAttributeNS(
                null,
                'd',
                'M467.925,204.625c-6.8,0-13.5-2.6-18.7-7.8c-111.5-111.4-292.7-111.4-404.1,0c-10.3,10.3-27.1,10.3-37.4,0s-10.3-27.1,0-37.4c64-64,149-99.2,239.5-99.2s175.5,35.2,239.5,99.2c10.3,10.3,10.3,27.1,0,37.4C481.425,202.025,474.625,204.625,467.925,204.625z'
            );
        }
        return this._outer;
    }

    /**
     * Get the middle arc of the wifi icon.
     */
    public get middle(): SVGElement {
        if (!this._middle) {
            this._middle = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'path'
            );
            this._middle.setAttributeNS(null, 'id', 'middle');
            this._middle.setAttributeNS(
                null,
                'd',
                'M395.225,277.325c-6.8,0-13.5-2.6-18.7-7.8c-71.4-71.3-187.4-71.3-258.8,0c-10.3,10.3-27.1,10.3-37.4,0s-10.3-27.1,0-37.4c92-92,241.6-92,333.6,0c10.3,10.3,10.3,27.1,0,37.4C408.725,274.725,401.925,277.325,395.225,277.325z'
            );
        }
        return this._middle;
    }

    /**
     * Get the inner arc of the wifi icon.
     */
    public get inner(): SVGElement {
        if (!this._inner) {
            this._inner = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'path'
            );
            this._inner.setAttributeNS(null, 'id', 'inner');
            this._inner.setAttributeNS(
                null,
                'd',
                'M323.625,348.825c-6.8,0-13.5-2.6-18.7-7.8c-15.4-15.4-36-23.9-57.8-23.9s-42.4,8.5-57.8,23.9c-10.3,10.3-27.1,10.3-37.4,0c-10.3-10.3-10.3-27.1,0-37.4c25.4-25.4,59.2-39.4,95.2-39.4s69.8,14,95.2,39.5c10.3,10.3,10.3,27.1,0,37.4C337.225,346.225,330.425,348.825,323.625,348.825z'
            );
        }
        return this._inner;
    }

    /**
     * Used to set the speed of the status light.
     * @param speed - Set the speed of the blink, higher numbers make the status light blink faster.
     */
    blinkVideoQualityStatus(speed: number) {
        let iteration = speed;
        let opacity = 1;
        const tickID = setInterval(() => {
            opacity -= 0.1;
            this.qualityText.style.opacity = String(
                Math.abs((opacity - 0.5) * 2)
            );
            if (opacity <= 0.1) {
                if (--iteration == 0) {
                    clearInterval(tickID);
                } else {
                    opacity = 1;
                }
            }
        }, 100 / speed);
    }

    /**
     * updates the QP tooltip by converting the Video Encoder QP to a color light
     * @param QP - The video encoder QP number needed to find the average
     */
    updateQpTooltip(QP: number) {
        this.videoEncoderAvgQP = QP;
        if (QP > this.redQP) {
            this.color = 'red';
            this.blinkVideoQualityStatus(2);
            this.statsText = `<div style="color: ${this.color}">Poor encoding quality</div>`;
            this.outer.setAttributeNS(null, 'fill', '#3c3b40');
            this.middle.setAttributeNS(null, 'fill', '#3c3b40');
            this.inner.setAttributeNS(null, 'fill', this.color);
            this.dot.setAttributeNS(null, 'fill', this.color);
        } else if (QP > this.orangeQP) {
            this.color = 'orange';
            this.blinkVideoQualityStatus(1);
            this.statsText = `<div style="color: ${this.color}">Blocky encoding quality</div>`;
            this.outer.setAttributeNS(null, 'fill', '#3c3b40');
            this.middle.setAttributeNS(null, 'fill', this.color);
            this.inner.setAttributeNS(null, 'fill', this.color);
            this.dot.setAttributeNS(null, 'fill', this.color);
        } else if (QP <= 0) {
            this.color = '#b0b0b0';
            this.outer.setAttributeNS(null, 'fill', '#3c3b40');
            this.middle.setAttributeNS(null, 'fill', '#3c3b40');
            this.inner.setAttributeNS(null, 'fill', '#3c3b40');
            this.dot.setAttributeNS(null, 'fill', '#3c3b40');
            this.statsText = `<div style="color: ${this.color}">Not connected</div>`;
        } else {
            this.color = 'lime';
            this.qualityStatus.style.opacity = '1';
            this.statsText = `<div style="color: ${this.color}">Clear encoding quality</div>`;
            this.outer.setAttributeNS(null, 'fill', this.color);
            this.middle.setAttributeNS(null, 'fill', this.color);
            this.inner.setAttributeNS(null, 'fill', this.color);
            this.dot.setAttributeNS(null, 'fill', this.color);
        }
        this.qualityText.innerHTML = this.statsText;
    }
}
