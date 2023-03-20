## Customizing the Player Widget Style

CSS Styles for the frontend application are applied on page-load using [`PixelStreamingApplicationStyle`](/Frontend/ui-library/src/Styles/PixelStreamingApplicationStyles.ts) object, which is then applied to the page using the `PixelStreamingApplicationStyle.applyStyleSheet` method. This must be invoked in your implementation before the the application object is created and added to the page.

Rather than altering or extending the `PixelStreamingApplicationStyle` class, the constructor can be supplied with an object containing your desired CSS options as well as separate base color palettes (reused extensively by the default style) for light mode and dark mode. Further customizations to the base color palette can be made either by using the `setColorMode` method to select light mode or dark, or by invoking `applyPalette` with a custom `ColorPalette`.

This system will apply over any existing CSS in your implementation's HTML page and so it is recommended this method be used for the cleanest interoperability with the rest of the frontend infrastructure.

