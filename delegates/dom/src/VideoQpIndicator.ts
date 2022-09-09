/**
 * Class for the VideoQp indicator
 */
 export class VideoQpIndicator {

	videoEncoderAvgQP: number = -1;

	// the icon itself
	qualityStatus: SVGElement; // = document.getElementById("connectionStrength");

	// the text that displays under the icon
	qualityText: HTMLSpanElement; // = document.getElementById("qualityText");

	// svg paths
	outer: any; //= document.getElementById("outer");
	middle: any; //= document.getElementById("middle");
	inner: any; // = document.getElementById("inner");
	dot: any; // = document.getElementById("dot");

	// non html elements 
	statsText: string = "";
	color: string = "";

	// qp colours 
	readonly orangeQP = 26;
	readonly redQP = 35;

	/**
	 * construct a VideoQpIndicator object
	 * @param qualityStatusId the html id of the qualityStatus element
	 * @param qualityTextId the html id of the qualityText element
	 * @param outerId the html id of the outer element
	 * @param middleId the html id of the middle element
	 * @param innerId the html id of the inner element
	 * @param dotId the html id of the dot element
	 */
	constructor(qualityStatusId: string, qualityTextId: string, outerId: string, middleId: string, innerId: string, dotId: string) {
		this.qualityStatus = document.getElementById(qualityStatusId) as any;
		this.qualityText = document.getElementById(qualityTextId) as any;
		this.outer = document.getElementById(outerId) as any;
		this.middle = document.getElementById(middleId) as any;
		this.inner = document.getElementById(innerId) as any;
		this.dot = document.getElementById(dotId) as any;
	}

	/**
	 * used to set the speed of the status light
	 * @param speed - Set the speed of the blink if the status light higher the speed the faster the blink
	 */
	blinkVideoQualityStatus(speed: number) {
		let iteration = speed;
		let opacity = 1;
		let tickID = setInterval(() => {
			opacity -= 0.1;
			this.qualityText.style.opacity = String(Math.abs((opacity - 0.5) * 2));
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
	  * updates the QP tooltip by converting the Video Encoder QP to a colour light
	  * @param QP - The video encoder QP number needed to find the average
	  */
	updateQpTooltip(QP: number) {
		this.videoEncoderAvgQP = QP;
		if (QP > this.redQP) {
			this.color = "red";
			this.blinkVideoQualityStatus(2);
			this.statsText = `<div style="color: ${this.color}">Poor encoding quality</div>`;
			this.outer.style.fill = "#3c3b40";
			this.middle.style.fill = "#3c3b40";
			this.inner.style.fill = this.color;
			this.dot.style.fill = this.color;
		} else if (QP > this.orangeQP) {
			this.color = "orange";
			this.blinkVideoQualityStatus(1);
			this.statsText = `<div style="color: ${this.color}">Blocky encoding quality</div>`;
			this.outer.style.fill = "#3c3b40";
			this.middle.style.fill = this.color;
			this.inner.style.fill = this.color;
			this.dot.style.fill = this.color;
		} else if (QP <= 0) {
			this.color = "#b0b0b0";
			this.outer.style.fill = "#3c3b40";
			this.middle.style.fill = "#3c3b40";
			this.inner.style.fill = "#3c3b40";
			this.dot.style.fill = "#3c3b40";
			this.statsText = `<div style="color: ${this.color}">Not connected</div>`;
		} else {
			this.color = "lime";
			this.qualityStatus.style.opacity = '1';
			this.statsText = `<div style="color: ${this.color}">Clear encoding quality</div>`;
			this.outer.style.fill = this.color;
			this.middle.style.fill = this.color;
			this.inner.style.fill = this.color;
			this.dot.style.fill = this.color;
		}
		this.qualityText.innerHTML = this.statsText;
	}

}