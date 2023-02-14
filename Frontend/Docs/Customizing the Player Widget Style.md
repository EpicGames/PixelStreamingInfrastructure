**TO DO**: Update this information to match the new front end.

## Customizing the Player Widget Style

In your custom HTML player page, you should have defined the Pixel Streaming player widget: a `div` element with `id="player"`. You can use standard HTML and CSS methods to add styling to this widget.

However, the widget may occasionally need to reinitialize its size. This typically occurs when the browser window is resized (if the widget is set to automatically fill the available space), or when the resolution of the input video stream is updated. When this happens, the `style` attribute of the player element is overwritten with new values, which can potentially overwrite values that you have set in your own HTML or JavaScript.

To avoid this, you can set your custom CSS values in a special global variable named `styleAdditional`. Whenever `app.js` needs to resize the player and clear its style, it will append the values you set in the `styleAdditional` variable to the end of the new style attributes it assigns to the player element. For example, the following value changes the mouse cursor to a hand when the user hovers the mouse over the player widget:

    styleAdditional = 'cursor: grab; cursor: -moz-grab; cursor: -webkit-grab';
