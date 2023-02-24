**TO DO**: Update this information to match the new front end.

## Communicating from the Player Page to UE5

The `app.js` file provides two JavaScript functions that you can call in your HTML player page to allow the user to send events and commands from the browser to the Unreal Engine application:

*   You can use `emitCommand` to send console commands back to Unreal Engine. For example, `stat fps` to show the frame rate. See [Using the emitCommand Function below](#using-the-emitcommand-function).
*   `emitUIInteraction` sends any arbitrary string or JavaScript object to the game. Use this function to send your own custom commands from your player UI, which you can respond to in your gameplay logic to produce any effect you need in your application. See [Using the emitUIInteraction Function below](#using-the-emituiinteraction-function).

### Using the emitCommand Function

When you call the `emitCommand` function, you must pass it a JavaScript object. This object must contain a key that matches one of the following strings:

*   `ConsoleCommand` \- Use this key to execute a console command on the remote Unreal Engine application. The value of this key should be a string that contains the command you want to run, along with any parameters it needs. For example:

        let descriptor = {
            ConsoleCommand: 'stat fps'
        }
        emitCommand(descriptor);

**_NOTE:_**
Due to the power of the Unreal Engine console commands, the `emitCommand` function can present a security risk. In order for this function to work, you also need to provide the `-AllowPixelStreamingCommands` parameter on the command line when you launch your Unreal Engine application or start it from the Unreal Editor using the Standalone Game option.


### Using the emitUIInteraction Function

When you call the `emitUIInteraction` function, you can pass it a single string or JavaScript object. For example:

    emitUIInteraction("MyCustomCommand");

or

    let descriptor = {
        LoadLevel: "/Game/Maps/Level_2"
        PlayerCharacter: {
            Name: "Shinbi"
            Skin: "Dynasty"
        }
    }
    emitUIInteraction(descriptor);

If you pass a JavaScript object, the `emitUIInteraction` function converts it to a JSON string internally. It then passes the resulting string back to the Pixel Streaming Plugin in your Unreal Engine application, which raises an event on the input controller. In your application's gameplay logic, you bind your own custom event to handle these inputs, using the **Bind Event to OnPixelStreamingInputEvent** node. For example:

<p align="center">
    <img src="Resources\Images\pixelstreaming-uiinteractionrespond.JPG" alt="Bind Event to OnPixelStreamingInputEvent">
</p>

You need to bind this event once, typically at the start of your game. Each time any player HTML page connected to an instance of your Unreal Engine application calls the `emitUIInteraction`function, your custom event is automatically invoked, regardless of the input passed to `emitUIInteraction`.  

The custom event you assign (for example, the **UI Interaction** node in the image above) has an output named **Descriptor**, which you can use to retrieve the string that was sent to your Unreal Engine application by the `emitUIInteraction` function. You can use that value to determine how your gameplay code needs to respond each time `emitUIInteraction` is called.

For example, the following Blueprint tests to see whether the input given to `emitUIInteraction` contains the string "MyCustomCommand", and calls a custom function to handle the event:


<p align="center">
    <img src="Resources\Images\pixelstreaming-respond-searchsubstring.JPG" alt="Search for substring">
</p>

If you originally passed a JavaScript object to `emitUIInteraction`, you can retrieve the value of any key from that JSON object using the **Pixel Streaming > Get Json String Value** node. For example, the following Blueprint tests for a key named LoadLevel. If that key is present, it calls a custom function to handle the event:


<p align="center">
    <img src="Resources\Images\pixelstreaming-respond-json.JPG" alt="Get a JSON field value">
</p>


**_Tip:_**
If you need to retrieve a nested key, use the dot notation common in JavaScript for your key. 
For example, `PlayerCharacter.Name` or `PlayerCharacter.Skin`.