**TO DO**: Update this information to match the new front end.

## HTML Page Requirements

Your custom HTML player page must follow a few minimal requirements.

* You must include the `/scripts/webRtcPlayer.js` file. This file handles communication between the browser and the Unreal Engine application, receiving and showing the media stream from the server. Do not modify this JavaScript file unless absolutely necessary.  

        <script type="text/javascript" src="scripts/webRtcPlayer.js"></script>

* We highly recommend that you also include the */scripts/app.js* file as well. This file sets up event listeners that process the keyboard, mouse, and touch events. It also contains several functions and hooks that you can take advantage of in your player page, described in the sections below on this page.  If you have some knowledge of JavaScript, you should feel free to dig into the code of this file and modify the default behavior to suit your needs. For example, if you want to disable keyboard inputs but leave mouse and touch events working, you will need to customize this file by finding and commenting out the code that handles keyboard events.  

        <script type="text/javascript" src="scripts/app.js"></script>

* The page must have a `div` element with the ID `player`. This element is replaced with the video frames streamed from the UE5 application.

        <div id="player"></div>

* You must call the `load` function provided by the `app.js` file when your page loads. For example, you can do this by adding an `onload` handler to the `body` tag:

        <body onload="load()">

### Player File Location and URL

You have a few options for where you can place your custom HTML player page, and how client browsers can access it.

*   You can make a folder called `custom_html` inside the root folder of your Signaling and Web Server, and place your custom HTML player page inside this folder. It will then be accessible by appending its filename to the IP address or hostname of the computer running the Signaling and Web Server.  
    For example, a file named `custom_html/myplayerpage.html` would be accessible at `http://127.0.0.1/myplayerpage.html`.
*   You can customize the `HomepageFile` parameter for the Signaling and Web Server, and set the path to the filename of your custom HTML player page relative to the root folder of the Signaling and Web Server. It will then be accessible when you access the IP address or hostname of the computer running the Signaling and Web Server.  
    For example, if you save a file to `Engine/Source/Programs/PixelStreaming/WebServers/SignallingWebServer/myfolder/myplayerpage.html`, and you set the `HomepageFile` parameter to `myfolder/myplayerpage.html`, the page would be accessible without needing to provide a file name in the URL: `http://127.0.0.1/`.
*   You can also use the **AdditionalRoutes** parameter for the Signaling and Web Server to customize the mapping between URL paths and local folders on your computer.

For additional details on these parameters, see also the [Pixel Streaming Reference](sharing-and-releasing-projects/pixel-streaming/pixel-streaming-reference).
