## Communicating from UE5 to the Player Page

You can make your Unreal Engine application emit custom events to all connected player HTML pages, which you can respond to in the player's JavaScript environment. This lets you change your web page UI in response to gameplay events.

To set this up:

1.  In your Unreal Engine application, any time you want to emit an event to the player page, you need an actor with a **Pixel Streaming Input** component. This component has access to the **Send Pixel Streaming Response** node. Specify a custom string argument to the node to send a message to the web frontend.


<p align="center">
    <img src="Resources\Images\pixelstreaming-send-game-event.png" alt="Send game event">
</p>

2. In your TypeScript frontend implementation these messages are consumed by an event listener. This event will be invoked every time the frontend receives a custom message from the Unreal Engine application. The original string argument given to the **Send Pixel Streaming Response** node will be passed to the function as the `response` argument. For example:

```typescript
	public myHandleResponseFunction(response: string) => void {
		Logger.Info(Logger.GetStackTrace(), "Response received!");
		switch (response) {
			case "MyCustomEvent":
				... // handle one type of event
			case "AnotherEvent":
				... // handle another event
		}
	}
```

3.  Register your listener function by using the `addResponseEventListener` function provided by the `PixelStreaming` object, found in PixelStreaming/PixelStreaming.ts. You pass this function a unique name for your event listener, and your function. For example:

        addResponseEventListener("handle_responses", myHandleResponseFunction);

4.  If you ever need to remove your event listener, call `removeResponseEventListener` and pass the same name. For example:

        removeResponseEventListener("handle_responses");

**_Tip:_**
If you want to pass more complex data, you can format the string you pass to the **Pixel Streaming Input -> Send Pixel Streaming Response** node as JSON. For example:

<p align="center">
    <img src="Resources\Images\pixelstreaming-send-game-event-json.png" alt="Send Pixel Streaming response using JSON">
</p>

Then, in your response event handler function, use  `JSON.parse(data)` to decode the string back into a TypeScript object.

