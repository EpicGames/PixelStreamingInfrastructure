## HTML Page Requirements

Most of the HTML that will end up on the final page will actually be introduced by the Pixel Streaming application itself. Several example HTML pages are provided in the [sample implementations](/Frontend/implementations/typescript/src) where you can see the base page is very minimal, only serving as a space for the application to attach to and fill. The only concrete requirements are for ensuring there's sufficient space taken up by the element being attached to for the viewport to be visible on screen. In the sample implementations this is simply a `<body>` tag set to fill the screen without scrolling.

```html
<!-- Copyright Epic Games, Inc. All Rights Reserved. -->
<!DOCTYPE html>
<html style="width: 100%; height: 100%">

<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
</head>

<!-- The Pixel Streaming player fills 100% of its parent element but body has a 0px height unless filled with content. As such, we explicitly force the body to be 100% of the viewport height -->
<body style="width: 100vw; height: 100vh; min-height: -webkit-fill-available; font-family: 'Montserrat'; margin: 0px">

</body>

</html>
```

As can be seen in the [sample implementations](/Frontend/implementations/typescript/src/player.ts), you must specify which element on the page the Pixel Streaming viewport is to be appended to. In the sample implementations this is typically done in the `document.body.onload` event listener and in this case appended to the `document.body` element in the DOM, causing it to fill the whole page.

[//]: # (This has yet to be done)
### Player File Location and URL

You have a few options for where you can place your custom HTML player page, and how client browsers can access it.

*	You can create a new implementation page and place it in [`/Frontend/implementations/typescript/src/`](/Frontend/implementations/typescript/src) alongside the sample implementations. This must consist of both a base `.html` page and the `.ts` source for your application's entrypoint. This will then be accessible by appending the name of the `html` file to IP address or hostname of the computer running the Signalling Server.
	For example, the sample `stresstest` page can be accessed on a locally-running infrastructure at `http:/127.0.0.1/stresstest.html`.
*   You can customize the `HomepageFile` parameter for the Signaling and Web Server, and set the path to the filename of your custom HTML player page relative to the [Frontend implementations source folder](/Frontend/implementations/src). It will then be accessible when you access the IP address or hostname of the computer running the Signaling and Web Server.
*   You can also use the **AdditionalRoutes** parameter for the Signaling and Web Server to customize the mapping between URL paths and local folders on your computer.

### Building the Frontend
When starting the infrastructure Signalling Server, the Frontend should be built automatically. If not, you can run the [`setup_frontend`](/SignallingWebServer/platform_scripts/) script for your platform to do so. If you subsequently make any changes to your local copy of the frontend, you will need to run the script again, appending `--build` as an argument to force a rebuild.

