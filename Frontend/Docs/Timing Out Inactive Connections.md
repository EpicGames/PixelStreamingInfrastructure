## Timing Out Inactive Connections

In some kinds of Pixel Streaming deployments, you may want to automatically disconnect users who have been inactive for a certain period of time. For example, if you have a limited pool of Unreal Engine applications available, with access to those instances controlled by a matchmaking server, you may need to drop inactive older connections in order to make sure that you have application instances available to handle new incoming connection requests.

You can configure your Pixel Streaming implementation to detect when a user appears to be away from keyboard (AFK)—that is, when the user has not interacted with the player widget within a customizable time interval. The AFK system warns the user:

<p align="center">
    <img src="Resources\Images\afk-warning.png" alt="AFK timeout warning">
</p>

If the user continues not to respond, the AFK system waits 10 more seconds before ultimately disconnecting their session.

Any user interaction with the player panel resets the AFK timer. This includes mouse moves and drags, mouse button presses, keyboard presses, touch events on mobile devices, and custom interactions you set up with the `emitCommand` and `emitUIInteraction` functions.

To use the AFK system, set the following properties in the [`Config`](https://github.com/EpicGames/PixelStreamingInfrastructure/blob/master/Frontend/library/src/Config/Config.ts) object passed used to create a [`PixelStreaming`](https://github.com/EpicGames/PixelStreamingInfrastructure/blob/master/Frontend/library/src/PixelStreaming/PixelStreaming.tx) stream.

| Property | Default | Description |
|    ---   | --- |
| `Flags.AFKDetection` | `false` | Determines whether the AFK system should check for user interactions. |
| `NumericParameters.AFKTimeoutSecs` | `120` | Sets the maximum time interval, in seconds, that the user can remain away from keyboard before seeing a warning overlay in the player widget. |

For example, to activate AFK Detection and set it to kick in after five minutes, you would do the following in your implementation:

```typescript
const config = new Config({ useUrlParams: true });
config.setFlagEnabled(Flags.AFKDetection, true);
config.setNumericSetting(NumericParameters.AFKTimeoutSecs, 300);

const stream = new PixelStreaming(config);
```

**_Tip:_**
If you want to customize the content of the overlay, you can replace the [`AFKOverlay`](https://github.com/EpicGames/PixelStreamingInfrastructure/blob/master/Frontend/ui-library/src/Overlay/AFKOverlay.ts) class. You must then also extend the [`Application`](https://github.com/EpicGames/PixelStreamingInfrastructure/blob/master/Frontend/ui-library/src/Application/Application.ts) class in order to use the new overlay.

