**TO DO**: Update this information to match the new front end.

## Communicating from UE5 to the Player Page

You can make your Unreal Engine application emit custom events to all connected player HTML pages, which you can respond to in the player's JavaScript environment. This lets you change your web page UI in response to gameplay events.

To set this up:

1.  In your Unreal Engine application, any time you want to emit an event to the player page, use the **Pixel Streaming > Send Pixel Streaming Response** node. Specify a custom string argument to the node to indicate to the player page what event has happened.  


    ![](Docs\Resources\Images\pixelstreaming-send-game-event.JPG)

2.  In the JavaScript of your player page, you'll need to write a custom event handler function that will be invoked each time the page receives a response event from the Unreal Engine application. It will be passed the original string argument that was sent by the **Send Pixel Streaming Response** node. For example:

        function myHandleResponseFunction(data) {
            console.warn("Response received!");
            switch (data) {
                case "MyCustomEvent":
                    ... // handle one type of event
                case "AnotherEvent":
                    ... // handle another event
            }
        }

3.  Register your listener function by calling the `addResponseEventListener` function provided by `app.js`. You pass this function a unique name for your event listener, and your function. For example:

        addResponseEventListener("handle_responses", myHandleResponseFunction);

4.  If you ever need to remove your event listener, call `removeResponseEventListener` and pass the same name. For example:

        removeResponseEventListener("handle_responses");

**_Tip:_**
If you want to pass more complex data, you can format the string you pass to the **Send Pixel Streaming Response** node as JSON. For example:  
![Send Pixel Streaming response using JSON](Resources\Images\pixelstreaming-send-game-event-json.png "Send Pixel Streaming response using JSON")  
Then, in your JavaScript event handler function, use  `JSON.parse(data)` to decode the string back into a JavaScript object.

