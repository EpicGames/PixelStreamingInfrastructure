## Recommended Reading
We recommend starting with the [sample implementations](/Frontend/implementations/typescript/src) in order to judge how to put a new player page together and integrate it with your Unreal Engine application. Additionally, if you have cloned the Pixel Streaming Infrastructure repository and made upstream changes, you can fork the repo and make a pull request.

## Using the default Player Webpage
The Pixel Streaming Signalling and Web Server provides a sample player page that is already set up to stream in media from your Unreal Engine application and to send mouse, keyboard, and touch events back to the application. You can use this default player page as-is, if it meets your needs.

## Customising the Player Webpage
With a little creativity and some knowledge of web technologies like TypeScript, HTML, and CSS, you can take full control over the player page, creating your own custom UIs for interacting with your Unreal Engine content remotely. You can trigger and respond to gameplay events, issue console commands to control the Unreal Engine's behavior, and more.

The pixel streaming infrastructure comes with a few [example implementations](/Frontend/implementations/) already provided which can be used to reference how the player webpage itself is structured. Mainly, they use the `Stream` class of the `library` package for WebRTC communication, and the `Application` class of the `ui-library` package for UI.

The player's UI HTML is created when an [`Application`](/Frontend/ui-library/src/Application/Application.ts) instance is created. All the UI which forms the basis of the player page is attached to this object's `rootElement`. This element can be attached to the page to display it (in the example implementations, it is attached directly to the body itself).

### Disabling or providing external UI elements
By default, the `Application` automatically creates elements for displaying information about and controlling the stream, such as:
 - A full screen button
 - A Settings button + panel
 - A Stats button + panel
 - A video QP indicator
 - An XR button

However, for many applications, it might be beneficial to disable certain elements. For example, an end-user-facing web page with a stream might need to disallow settings changes like endpoint address, or simplify the experience for the user by not displaying technologically advanced information. In other cases, it might be good to style the player webpage using custom HTML/CSS, and use elements from that page to control the stream.

For such use cases, the initial configuration object used when createing an `Application` can be changed to customize the way UI elements are created. It is called `UIOptions` and can contain any combination of settings for the aforemention elements, stored in the following parameters: `settingsPanelConfig`, `statsPanelConfig`, `fullScreenControlsConfig`, `xrControlsConfig`, and `videoQpIndicatorConfig`.

For example, to create an application UI with no settings panel or button, and using an external HTML button for toggling the stream's fullscreen state:
```ts
// Import needed types
import { Config, PixelStreaming } from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.2';
import { Application, UIOptions, PanelConfiguration, UIElementCreationMode } from '@epicgames-ps/lib-pixelstreamingfrontend-ui-ue5.2'

// Create a stream and UI
const stream = new PixelStreaming(new Config({ useUrlParams: true }));
const application = new Application({
	stream: stream,
	onColorModeChanged: (isLightMode) => PixelStreamingApplicationStyles.setColorMode(isLightMode),
	settingsPanelConfig: { 
		isEnabled : false,
		visibilityButtonConfig : { creationMode : UIElementCreationMode.Disable }
	},
	fullScreenControlsConfig: {
		creationMode: UIElementCreationMode.UseCustomElement,
		customElement: document.getElementById('myCustomFullscreenButton')
	}
});
```

The `PixelStreaming` object can also directly interface with custom-made UI through its event listeners. For example, making something happen when the video quantization parameter (which can be used to gauge the quality of the video stream) changes, the following can be done (continued from above):
```ts
stream.addEventListener('videoEncoderAvgQP', (qp: number) => {
	/* Code to change any visuals needed based on the QP parameter */
})
```

### Customizing overlays

Further customizations can also be done using [`Overlays`](/Frontend/ui-library/src/Overlay). As the name suggests, these are overlaid onto the player page when certain conditions are met, such as the player being [absent](/Frontend/ui-library/src/AFKOverlay.ts) from the keyboard. Look through [`Application`](/Frontend/ui-library/src/Application/Application.ts) source to see what those conditions are, as well as how new overlays can be added.

### Customizing styling

For an overview on how to change the CSS style of the player and its component widgets, see [Customizing the Player Widget Style](/Frontend/Docs/Customizing%20the%20Player%20Widget%20Style.md).

## Changes to the base Pixel Streaming UI library

Additionally, deeper changes and expansions can be made to the `ui-library` project, which is used as the base for the Frontend UI implementations. Any useful changes can be merged in the main library through pull requests.