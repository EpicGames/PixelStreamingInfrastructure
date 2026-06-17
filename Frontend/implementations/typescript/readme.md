## Reference Pixel Streaming web frontend (written in vanilla TypeScript)

This is the stock look-and-feel Pixel Streaming player web page you are served out of the box with the shipped Pixel Streaming plugin. It is widely tested and is a fully featured Pixel Streaming experience. 

**This is great starting point for building your UI or studying the Pixel Streaming feature set.**

![Frontend](https://raw.githubusercontent.com/EpicGames/PixelStreamingInfrastructure/0aabae464daa95925cf6fa238ac18d0a5561a421/Frontend/implementations/EpicGames/docs/images/frontend.jpg)

The reference frontend uses:

1. The base `lib-pixelstreamingfrontend` library for all core streaming functionality.
2. The reference UI library `lib-pixelstreamingfrontend-ui` for all the UI.

Using these two libraries gives a fully functional (and customizable) Pixel Streaming experience.

This package is also a good example of how to include the frontend libraries as dependencies and bundle/minify the final application you ship.

### Key features of the reference frontend
- An info panel (screen right) that provides a UI for displaying live statistics to the user.
- A settings panel (screen right) that provides a UI for all the [settings](https://github.com/EpicGames/PixelStreamingInfrastructure/blob/master/Frontend/Docs/Settings%20Panel.md).
- A set of controls (screen left) to maximize the video, open the settings panel, open the info panel, and enter VR mode.
- Ability to display overlays that present information or errors to the user, or present prompts for the user to interact with.

### Building the reference frontend
```
cd Frontend/implementations/typescript
npm install
npm run build
```

**Note:** You will need to build the `Frontend/library` and `Frontend/ui-library` first.

### Using the reference frontend
Building the reference frontend using the commands above will place it in the `SignallingWebServer/www` directory.
```
# Serve the reference frontend
cd SignallingWebServer/platform_scripts/cmd
start.bat
# Navigate to http://localhost in your browser to see the reference frontend
```

**Note:** You can also run `start.bat --build` to build all the dependent libraries.

