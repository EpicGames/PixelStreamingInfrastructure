## Microphone feature summary

In its current state, the microphone feature in Pixel Streaming is designed to pass the streamer’s microphone input audio from Pixel Streaming to Unreal Engine. The WebRTC audio stream is not exposed nor further handled inside the engine, so any custom use of the audio stream will require significant modifications by the user.

## Enabling microphone input for Pixel Streaming in UE projects

Once you’ve enabled the Pixel Streaming plugin in your project, you’ll need to add the `Pixel Streaming Audio` component to your scene. It can be attached to any actor or asset in the scene, following these steps:

- Select any enabled actor or asset in your scene;
- Click the *Add* button, located in its details panel;
- Type *Pixel Streaming Audio* in the search bar and click the matching component:

<p align="center">
    <img src="Resources\Images\add-pixel-streaming-to-actor.png" alt="Add component to actor">
</p>

Once the component has been added, you can adjust its settings and specify a player or streamer ID to listen to, if you wish. The default configuration will be listening to the first peer it can hear and should be suitable for most basic use cases:

<p align="center">
    <img src="Resources\Images\settings-pixel-streaming-audio.png" alt="Component configuration">
</p>	

No more setup is required on the UE side, so the project is now ready to be packaged or used standalone.

## Enabling microphone in Pixel Streaming frontend

Launch Pixel Streaming and click the cog icon to open the stream settings, where you can enable the microphone toggle. Make sure to restart the stream to apply the changes:

<p align="center">
    <img src="Resources\Images\mic-toggle.png" alt="Component configuration">
</p>	

*Note:* Alternatively, you can enable the microphone by adding `?UseMic=true` to the url. You’ll still need to refresh the page for the change to take effect.

When doing this for the first time, your browser will likely ask your permission to use the microphone on this page, which you need to allow. Some browsers and firewalls may automatically block it, so you will need to create permission rules in your browser settings.

You are ready to roll! Connect to the stream and speak into the microphone. If everything has been set up correctly, your microphone input will be passed to UE and played back to you by Pixel Streaming, so you will hear yourself.

*Note:* The above steps will not work without the `Pixel Streaming Audio` component set up in your project. If you don’t hear any playback, double check your project for the appropriate component.

## Tips on handling the microphone WebRTC stream further

As mentioned earlier, the microphone audio stream isn’t handled further after it’s passed to UE. You might want to use it in custom ways, for example, feed it back to Pixel Streaming so you could hear the other players, or pass it to another plugin to create a voice chat. Here are some tips to help you get started:

- You can choose to use a voice chat plugin, whose audio data goes through the UE audio system, which will be automatically picked up by Pixel Streaming.
- If you would like to pass the data elsewhere, e.g. to your custom plugin, you'll need to create your own audio sink, see more information [here](https://github.com/EpicGames/UnrealEngine/blob/5ca9da84c694c6eee288c30a547fcaa1a40aed9b/Engine/Plugins/Media/PixelStreaming/Source/PixelStreaming/Public/IPixelStreamingStreamer.h#L220).
- You can implement Pixel Streaming audio mixer and plug the audio from your voice plugin into it. [Here](https://github.com/EpicGames/UnrealEngine/blob/release/Engine/Plugins/Media/PixelStreaming/Source/PixelStreaming/Private/AudioInputMixer.h) is a good jumping point.
- Both camera and microphone access will be blocked on *insecure origins* (in effect since Chrome 47), so make sure to use HTTPS for production. This is not required for local use, e.g. during development.
