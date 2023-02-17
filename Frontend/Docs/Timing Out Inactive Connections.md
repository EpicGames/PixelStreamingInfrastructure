**TO DO**: Update this information to match the new front end.

## Timing Out Inactive Connections

In some kinds of Pixel Streaming deployments, you may want to automatically disconnect users who have been inactive for a certain period of time. For example, if you have a limited pool of Unreal Engine applications available, with access to those instances controlled by a matchmaking server, you may need to drop inactive older connections in order to make sure that you have application instances available to handle new incoming connection requests.

You can configure your Pixel Streaming player page to detect when a user appears to be away from keyboard (AFK)—that is, when the user has not interacted with the player widget within a customizable time interval. The AFK system warns the user:

![AFK timeout warning](Resources\Images\afk-warning.png "AFK timeout warning")

If the user continues not to respond, the AFK system ultimately disconnects their session.

Any user interaction with the player panel resets the AFK timer. This includes mouse moves and drags, mouse button presses, keyboard presses, touch events on mobile devices, and custom interactions you set up with the `emitCommand` and `emitUIInteraction` functions.

To use the AFK system, set the following three properties in the JavaScript of your player page. Do this after you load the `app.js` file, but before you call its `load` function.

| Property | Description |
| --- | --- |
| `afk.enabled` | Determines whether the AFK system should check for user interactions. The default is `false`; set this value to `true` to time out inactive connections. |
| `afk.warnTimeout` | Sets the maximum time interval, in seconds, that the user can remain away from keyboard before seeing a warning overlay in the player widget. The default is `120`, or two minutes. |
| `afk.closeTimeout` | After the `afk.warnTimeout` interval has elapsed and the user sees a warning message about being disconnected, this variable sets the time interval, in seconds, before the user's connection is automatically disconnected unless they interact with the player widget. The default is `10`. |

**_Tip:_**
If you want to customize the content of the overlay, you can redefine the `updateAfkOverlayText()` function in your player page. In your implementation, set the `afk.overlay.innerHTML` property to the HTML that you want the player widget to display when users have been away longer than the AFK timeout value.
