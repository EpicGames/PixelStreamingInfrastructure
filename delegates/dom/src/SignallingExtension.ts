
import { MessageSend, WebSocketController } from "@tensorworks/libspsfrontend";
import { MessageRecv } from "@tensorworks/libspsfrontend";
import { Logger } from "@tensorworks/libspsfrontend";

/**
 * Auth Request Message Wrapper
 */
 export class MessageAuthRequest extends MessageSend {
    token: string;
    provider: string;

    /**
     * @param token - Token Provided by the Auth Provider
     * @param provider - Name of the provider that is registered in the auth plugin
     */
    constructor(token: string, provider: string) {
        super();
        this.type = "authenticationRequest";
        this.token = token;
        this.provider = provider;
    }
}

/**
 * States of the UE Instance
 */
 export enum InstanceState {
    UNALLOCATED = "UNALLOCATED",
    PENDING = "PENDING",
    FAILED = "FAILED",
    READY = "READY"
}

/**
 * Instance State Message wrapper
 */
 export class MessageInstanceState extends MessageRecv {
    state: InstanceState;
    details: string;
    progress: number;
}

/**
 * Types of Authentication reposes 
 */
 export enum MessageAuthResponseOutcomeType {
    REDIRECT = "REDIRECT",
    INVALID_TOKEN = "INVALID_TOKEN",
    AUTHENTICATED = "AUTHENTICATED",
    ERROR = "ERROR"
}

/**
 * Authentication Response Message wrapper
 */
 export class MessageAuthResponse extends MessageRecv {
    outcome: MessageAuthResponseOutcomeType;
    redirect: string;
    error: string;
}

/**
 * Instance Request Message Wrapper
 */
 export class MessageRequestInstance extends MessageSend {
    constructor() {
        super();
        this.type = "requestInstance";
    }
}

/**
 * Specific signalling extensions required by SPS.
 * For example: authenticationRequired, instanceState, authenticationResponse
 */
export class SPSSignalling {

	onInstanceStateChanged : (stateChangedMsg : string, isError: boolean) => void;
	onAuthenticationResponse : (authRespMsg : string, isError : boolean) => void;

	constructor(websocketController: WebSocketController){
		this.extendSignallingProtocol(websocketController);
	}

	/**
	 * Extend the signalling protocol with SPS specific messages.
	 */
	extendSignallingProtocol(webSocketController: WebSocketController) {

		// authenticationRequired
		webSocketController.signallingProtocol.addMessageHandler("authenticationRequired", (authReqPayload : string) => {
			Logger.Log(Logger.GetStackTrace(), "AUTHENTICATION_REQUIRED", 6);
			const url_string = window.location.href;
			const url = new URL(url_string);
			const authRequest = new MessageAuthRequest(url.searchParams.get("code"), url.searchParams.get("provider"));
			webSocketController.webSocket.send(authRequest.payload());
		});

		// instanceState
		webSocketController.signallingProtocol.addMessageHandler("instanceState", (instanceStatePayload : string) => {
			Logger.Log(Logger.GetStackTrace(), "INSTANCE_STATE", 6);
			const instanceState: MessageInstanceState = JSON.parse(instanceStatePayload);
			this.handleInstanceStateChanged(instanceState);
		});

		// authenticationResponse
		webSocketController.signallingProtocol.addMessageHandler("authenticationResponse", (authRespPayload : string) => {
			Logger.Log(Logger.GetStackTrace(), "AUTHENTICATION_RESPONSE", 6);

			const authenticationResponse: MessageAuthResponse = JSON.parse(authRespPayload);

			this.handleAuthenticationResponse(authenticationResponse);

			switch (authenticationResponse.outcome) {
				case MessageAuthResponseOutcomeType.REDIRECT: {
					window.location.href = authenticationResponse.redirect;
					break;
				}
				case MessageAuthResponseOutcomeType.AUTHENTICATED: {
					Logger.Log(Logger.GetStackTrace(), "User is authenticated and now requesting an instance", 6);

					webSocketController.webSocket.send(new MessageRequestInstance().payload());
					break;
				}
				case MessageAuthResponseOutcomeType.INVALID_TOKEN: {
					Logger.Info(Logger.GetStackTrace(), "Authentication error : Invalid Token");
					break;
				}
				case MessageAuthResponseOutcomeType.ERROR: {
					Logger.Info(Logger.GetStackTrace(), "Authentication Error from server Check what you are sending");
					break;
				}
				default: {
					Logger.Error(Logger.GetStackTrace(), "The Outcome Message has not been handled : this is really bad");
					break;
				}
			}

		});
	}

	/**
	* Set up functionality to happen when an instance state change occurs and updates the info overlay with the response
	* @param instanceState - the message instance state 
	*/
	handleInstanceStateChanged(instanceState: MessageInstanceState) {
		let instanceStateMessage = "";
		let isInstancePending = false;
		let isError = false;

		// get the response type
		switch (instanceState.state) {
			case InstanceState.UNALLOCATED:
				instanceStateMessage = "Instance Unallocated: " + instanceState.details;
				break;
			case InstanceState.FAILED:
				instanceStateMessage = "UE Instance Failed: " + instanceState.details;
				isError = true;
				break;
			case InstanceState.PENDING:
				isInstancePending = true;
				if (instanceState.details == undefined || instanceState.details == null) {
					instanceStateMessage = "Your application is pending";
				} else {
					instanceStateMessage = instanceState.details;
				}
				break;
			case InstanceState.READY:
				if (instanceState.details == undefined || instanceState.details == null) {
					instanceStateMessage = "Instance is Ready";

				} else {
					instanceStateMessage = "Instance is Ready: " + instanceState.details;
				}
				break;
			default:
				instanceStateMessage = "Unhandled Instance State" + instanceState.state + " " + instanceState.details;
				break;
		}

		if (isError) {
			this.onInstanceStateChanged(instanceStateMessage, true);
		} else if (isInstancePending) {

			//check if there is already and instance pending if so return 
			let preExistingPendingMessage = document.getElementById('loading-spinner') as HTMLDivElement;
			if (preExistingPendingMessage) {

				// only update our text div
				let textDiv = document.getElementById("text-"+instanceState.id) as HTMLSpanElement;
				textDiv.innerHTML = instanceStateMessage;
				return;
			}

			// build a wrapper to hold our text and our spinner
			var wrapperDiv: HTMLDivElement = document.createElement('div');

			// build a text div to hold our text message
			var textSpan: HTMLSpanElement = document.createElement('span');
			textSpan.id = "text-" + instanceState.id
			textSpan.innerHTML = instanceStateMessage;

			// build the spinner span
			var spinnerSpan: HTMLSpanElement = document.createElement('span');
			spinnerSpan.className = "visually-hidden"
			spinnerSpan.innerHTML = "Loading..."

			// build the spinner div
			var spinnerDiv: HTMLDivElement = document.createElement('div');
			spinnerDiv.id = "loading-spinner"
			spinnerDiv.className = "spinner-border ms-2"
			spinnerDiv.setAttribute("role", "status");

			// append wrapper and the spinner to the element
			wrapperDiv.appendChild(textSpan);
			wrapperDiv.appendChild(spinnerDiv).appendChild(spinnerSpan);

			// insert the inner html into the base div
			this.onInstanceStateChanged(wrapperDiv.outerHTML, false);
		} else {
			this.onInstanceStateChanged(instanceStateMessage, false);
		}
	}

	/**
	 * Set up functionality to happen when receiving an auth response and updates an info overlay with the response
	 * @param authResponse - the auth response message type
	 */
	handleAuthenticationResponse(authResponse: MessageAuthResponse) {
		let instanceStateMessage = "";
		let isError = false;

		// get the response type
		switch (authResponse.outcome) {
			case MessageAuthResponseOutcomeType.AUTHENTICATED:
				instanceStateMessage = "Authentication has succeeded. Requesting Instance";
				break;
			case MessageAuthResponseOutcomeType.INVALID_TOKEN:
				instanceStateMessage = "Invalid Token: " + authResponse.error;
				isError = true;
				break;
			case MessageAuthResponseOutcomeType.REDIRECT:
				instanceStateMessage = "Redirecting to: " + authResponse.redirect;
				break;
			case MessageAuthResponseOutcomeType.ERROR:
				instanceStateMessage = "Error: " + authResponse.error;
				isError = true;
				break;
			default:
				instanceStateMessage = "Unhandled Auth Response: " + authResponse.outcome;
				break;
		}

		// if the response is an error show the error instead of the info 
		if (isError) {
			this.onAuthenticationResponse(instanceStateMessage, true);
		} else {
			this.onAuthenticationResponse(instanceStateMessage, false);
		}
	}

}