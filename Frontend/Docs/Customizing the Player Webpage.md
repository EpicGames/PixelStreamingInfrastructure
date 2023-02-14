**TO DO**: Update this information to match the new front end.

## Customising the Player Webpage
The Pixel Streaming Signaling and Web Server provides a sample player page that is already set up to stream in media from your Unreal Engine application and to send mouse, keyboard, and touch events back to the application. You can use this default player page as-is, if it meets your needs. 

Recent changes to Pixel Streaming have moved the front end and web server elements of Pixel Streaming to an external repository. We refer to this as the Pixel Streaming Infrastructure.

There are a few ways to access the Pixel Streaming infrastructure.
1. Directly access the github repository as found here: [https://github.com/EpicGames/PixelStreamingInfrastructure](https://github.com/EpicGames/PixelStreamingInfrastructure)
1. Use `git clone --branch UE5.1 https://github.com/EpicGames/PixelStreamingInfrastructure.git` in your preferred terminal (make sure you have git installed). 
1. Navigate to `\Engine\Plugins\Media\PixelStreaming\Resources\WebServers` and run the `get_ps_servers` command (make sure to use the `.bat` script for Windows and `.sh` script for Linux accordingly). This will automatically pull the relevant branch of the Pixel Streaming infrastructure into that folder.
The git command mentioned above will pull the 5.1 branch of the infrastructure. If you need a different branch, please modify the git command accordingly.

For more information about the Pixel Streaming front end and webserver changes, see [Pixel Streaming Infrastructure](https://docs.unrealengine.com/5.1/en-US/pixel-streaming-infrastructure/)


However, with a little creativity and some knowledge of web technologies like JavaScript and HTML, you can take full control over the player page, creating your own custom UIs for interacting with your Unreal Engine content remotely. You can trigger and respond to gameplay events, issue console commands to control the Unreal Engine's behavior, and more.

We recommend using the default player page as a starting point for creating your own custom player page. You'll find this page at `PixelStreamingInfrastructure\SignallingWebServer\Public\player.html` under your Unreal Engine installation folder. Then, use the information on this page to learn how to extend your page and tie it in with your Project's gameplay logic.  

Additionally, if you have cloned the Pixel Streaming Infrastructure repository and made upstream changes, you can fork the repo and make a pull request.

_The default Pixel Streaming player page:_
![PixelStreamingDefaultPlayer](Resources\Images\pixelstreaming-default-interface.JPG)

_A customised Pixel Streaming player page:_
![PixelStreamingCustomPlayer](Resources\Images\pixelstreaming-custom-player.JPG)

