import * as libfrontend from '@epicgames/libfrontend'
import { LoadingOverlay } from './LoadingOverlay';
import { SPSSignalling } from './SignallingExtension';


export class SPSApplication extends libfrontend.Application {
	private loadingOverlay : LoadingOverlay;
	private signallingExtension : SPSSignalling;

	static Flags = class {
		static sendToServer = "sendStatsToServer"
	}

	constructor(config: libfrontend.Config) {
		super(config);
		this.signallingExtension = new SPSSignalling(this.webRtcController.webSocketController);
		this.signallingExtension.onAuthenticationResponse = this.handleSignallingResponse.bind(this);
		this.signallingExtension.onInstanceStateChanged = this.handleSignallingResponse.bind(this);

		this.enforceSpecialSignallingServerUrl();

		// Add 'Send Stats to Server' checkbox
		const spsSettingsSection = this.config.buildSectionWithHeading(this.settingsPanel.settingsContentElement, "Scalable Pixel Streaming");
		const sendStatsToServerSettings = new libfrontend.SettingFlag(
			SPSApplication.Flags.sendToServer,
			"Send stats to server",
			"Send session stats to the server",
			true
		);

		this.config.addSettingFlag(spsSettingsSection, sendStatsToServerSettings);
		this.loadingOverlay = new LoadingOverlay(this.videoElementParent);
	}

	onVideoStats(videoStats: libfrontend.AggregatedStats): void {
		super.onVideoStats(videoStats);

		if (this.config.isFlagEnabled(SPSApplication.Flags.sendToServer)) {
			this.webRtcController.sendStatsToSignallingServer(videoStats);
		}
	}

	handleSignallingResponse(signallingResp: string, isError: boolean) {
		if(isError) { 
			this.showErrorOverlay(signallingResp);
		} else { 
			this.showLoadingOverlay(signallingResp);
		}
	}

	enforceSpecialSignallingServerUrl() {
		// SPS needs a special /ws added to the signalling server url so K8s can distinguish it
		this.webRtcController.buildSignallingServerUrl = function() {
			let signallingUrl = this.config.getTextSettingValue(libfrontend.TextParameters.SignallingServerUrl);

			if(signallingUrl && signallingUrl !== undefined && !signallingUrl.endsWith("/ws")) {
				signallingUrl = signallingUrl.endsWith("/") ? signallingUrl + "ws" : signallingUrl + "/ws";
			}

			return signallingUrl
		};
	}

	showLoadingOverlay(signallingResp: string) {
		this.hideCurrentOverlay();
		this.loadingOverlay.show();
		this.loadingOverlay.update(signallingResp);
		this.loadingOverlay.animate();
		this.currentOverlay = this.loadingOverlay;
	}
}