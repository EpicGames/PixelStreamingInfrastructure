import * as libspsfrontend from '@tensorworks/libspsfrontend'
import { SPSSignalling } from './SignallingExtension';


export class NativeDOMDelegate extends libspsfrontend.DelegateBase {
	
	private signallingExtension : SPSSignalling;

	constructor(config: libspsfrontend.Config) {
		super(config);
		this.signallingExtension = new SPSSignalling(this.iWebRtcController.webSocketController);
		this.signallingExtension.onAuthenticationResponse = this.handleSignallingResponse.bind(this);
		this.signallingExtension.onInstanceStateChanged = this.handleSignallingResponse.bind(this);
		this.enforceSpecialSignallingServerUrl();
	}

	handleSignallingResponse(signallingResp: string, isError: boolean) {
		if(isError) { 
			this.showErrorOverlay(signallingResp);
		} else { 
			this.showTextOverlay(signallingResp);
		}
	}

	enforceSpecialSignallingServerUrl() {
		// SPS needs a special /ws added to the signalling server url so K8s can distinguish it
		this.iWebRtcController.buildSignallingServerUrl = function() {
			let signallingUrl = this.config.getTextSettingValue(libspsfrontend.TextParameters.SignallingServerUrl);

			if(signallingUrl && signallingUrl !== undefined && !signallingUrl.endsWith("/ws")) {
				signallingUrl = signallingUrl.endsWith("/") ? signallingUrl + "ws" : signallingUrl + "/ws";
			}

			return signallingUrl
		};
	}

}