import * as libspsfrontend from '@tensorworks/libspsfrontend'
import { SPSSignalling } from './SignallingExtension';


export class NativeDOMDelegate extends libspsfrontend.DelegateBase {
	
	private signallingExtension : SPSSignalling;

	static Flags = class {
		static sendToServer = "sendStatsToServer"
	}

	constructor(config: libspsfrontend.Config) {
		super(config);
		this.signallingExtension = new SPSSignalling(this.iWebRtcController.webSocketController);
		this.signallingExtension.onAuthenticationResponse = this.handleSignallingResponse.bind(this);
		this.signallingExtension.onInstanceStateChanged = this.handleSignallingResponse.bind(this);

		// Add 'Send Stats to Server' checkbox
		const spsSettingsSection = this.config.buildSectionWithHeading(this.settingsPanel.settingsContentElement, "Scalable Pixel Streaming");
		const sendStatsToServerSettings = new libspsfrontend.SettingFlag(
			NativeDOMDelegate.Flags.sendToServer,
			"Send stats to server",
			"Send session stats to the server",
			true
		);

		this.config.addSettingFlag(spsSettingsSection, sendStatsToServerSettings);
	}

	onVideoStats(videoStats: libspsfrontend.AggregatedStats): void {
		super.onVideoStats(videoStats);

		if (this.config.isFlagEnabled(NativeDOMDelegate.Flags.sendToServer)) {
			this.iWebRtcController.sendStatsToSignallingServer(videoStats);
		}
	}

	handleSignallingResponse(signallingResp: string, isError: boolean) {
		if(isError) { 
			this.showErrorOverlay(signallingResp);
		} else { 
			this.showTextOverlay(signallingResp);
		}
	}

}