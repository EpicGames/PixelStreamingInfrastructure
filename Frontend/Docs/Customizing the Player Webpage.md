## Recommended Reading
We recommend starting with the [sample implementations](/Frontend/implementations/EpicGames/src) in order to judge how to put a new player page together and integrate it with your Unreal Engine application. Additionally, if you have cloned the Pixel Streaming Infrastructure repository and made upstream changes, you can fork the repo and make a pull request.


## Customising the Player Webpage
The Pixel Streaming Signalling and Web Server provides a sample player page that is already set up to stream in media from your Unreal Engine application and to send mouse, keyboard, and touch events back to the application. You can use this default player page as-is, if it meets your needs.

However, with a little creativity and some knowledge of web technologies like TypeScript, HTML, and CSS, you can take full control over the player page, creating your own custom UIs for interacting with your Unreal Engine content remotely. You can trigger and respond to gameplay events, issue console commands to control the Unreal Engine's behavior, and more.

The pixel streaming infrastructure comes with a few [example implementations](/Frontend/implementations/) already provided which can be used to reference how the player webpage itself is structured. Any required HTML is added to the page when the [`Application`](/Frontend/ui-library/src/Application/Application.ts) is attached. Your application should have a `rootElement` comprising the the required HTML elements to form the basis for your player page. This element then needs to be attached to the page, in the example implementations this is attached directly to the body itself.

Further customizations can also be done using [`Overlays`](/Frontend/ui-library/src/Overlay). As the name suggests these are overlaid onto the player page when certain conditions are met, such as the player being [absent](/Frontend/ui-library/src/AFKOverlay.ts) from the keyboard. Look through [`Application`](/Frontend/ui-library/src/Application/Application.ts) source to see what those conditions are as well as how new overlays can be added.

For an overview on how to change the CSS style of the player and its component widgets, see [Customizing the Player Widget Style](/Frontend/Docs/Customizing%20the%20Player%20Widget%20Style.md).

