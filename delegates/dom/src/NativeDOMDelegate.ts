import * as libspsfrontend from '@tensorworks/libspsfrontend'
import { SPSSignalling } from './SignallingExtension';


export class NativeDOMDelegate extends libspsfrontend.DelegateBase {
	
	private signallingExtension : SPSSignalling;

	constructor(config: libspsfrontend.Config) {
		super(config);
		this.signallingExtension = new SPSSignalling(this.iWebRtcController.webSocketController);
		this.signallingExtension.onAuthenticationResponse = this.handleSignallingResponse.bind(this);
		this.signallingExtension.onInstanceStateChanged = this.handleSignallingResponse.bind(this);
	}

	handleSignallingResponse(signallingResp: string, isError: boolean) {
		if(isError) { 
			this.showErrorOverlay(signallingResp);
		} else { 
			this.showTextOverlay(signallingResp);
		}
	}

}