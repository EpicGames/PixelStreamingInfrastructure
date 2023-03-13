## Configuring library behaviour

The frontend library exposes a number of configuration options through the [Config](/Frontend/library/src/Config/Config.ts) class. The values of these options can be modified to tweak certain inbuilt behaviour of the frontend.

The following options are available in the frontend library:

**TO DO**: Update this information to match the new front end.

| Property | Default | Description |
| --- | --- | --- |
| controlScheme | `ControlSchemeType.LockedMouse` | Determines whether or not the player widget captures and locks the mouse when the player interacts with the widget.|
| suppressBrowserKeys | true |When this setting is enabled, the player widget will intercept function keys (**F1** to **F12**) and the **Tab** key, and pass those keypress events through to the Unreal Engine application rather than allowing the browser to process them normally.| This means, for example, that while this setting is active, pressing **F5** will not refresh the player page in the browser. Instead, that event is passed through to the Unreal Engine application, and has its usual function of switching the view to visualize shader complexity.
| fakeMouseWithTouches | false | When this option is enabled, and the user is viewing the stream on a device with a touch screen such as a smartphone or tablet, this setting causes single-finger touch events to be interpreted by the Unreal Engine application as mouse clicks and drag events. Enabling this setting can provide users on mobile devices with the ability to partially control your Unreal Engine application, even when the application's input controller does not specifically handle touch input events. |


**_NOTE:_**  The controlScheme accepts the following values:
* `ControlSchemeType.LockedMouse` - When this control scheme is active, clicking on the player widget causes it to capture and lock the mouse cursor. Any further movements of the mouse are passed immediately to the input controller in the Unreal Engine application. This typically allows the user to move and rotate the camera by simply dragging the mouse. To release the cursor from the control of the player widget, the user can press the **Esc** key.
* `ControlSchemeType.HoveringMouse` - When this control scheme is active, the mouse cursor hovers over the player widget without interacting with it. In order to send the mouse movements to the input controller of the Unreal Engine application, the user needs to click and hold the left button of the mouse.


You can set these values in your player page by including a code block like the following. Make sure that you run this code any time after you load the `app.js` file into the page, but before you call its `load` function.

    <script>
    inputOptions.controlScheme = ControlSchemeType.HoveringMouse;
    inputOptions.fakeMouseWithTouches = true; 
    </script>

### Disabling User Input

To disable user input entirely for one or more types of input device, you can override the following functions in the JavaScript environment for your player page with empty implementations:

*   **registerHoveringMouseEvents** - Disables all input mouse events when the inputOptions.controlScheme is set to ControlSchemeType.HoveringMouse.
*   **registerLockedMouseEvents** - Disables all input mouse events when the inputOptions.controlScheme is set to ControlSchemeType.LockedMouse.
*   **registerTouchEvents** - Disables touch events on mobile devices and tablets.
*   **registerKeyboardEvents** - Disables all keyboard events.

For example, you could include this block of JavaScript in your player HTML page to disable all inputs. As above, run this code any time after you load the `app.js` file into the page, but before you call its `load` function.

    <script>
    registerHoveringMouseEvents = function() {}
    registerLockedMouseEvents = function() {}
    registerTouchEvents = function() {}
    registerKeyboardEvents = function() {} 
    </script>

To keep one or more types of inputs active, comment out or remove the line that corresponds to the type of input you want to keep.

