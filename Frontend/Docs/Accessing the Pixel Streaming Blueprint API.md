## Accessing the Pixel Streaming Blueprint API

The Pixel Streaming Plugin that runs within the Unreal Engine exposes a Blueprint API that you can use in your gameplay logic to handle custom UI events sent by the player HTML page, and to emit events from the Unreal Engine to the player page.

To access this Blueprint API, add the **PixelStreamingInputComponent** to an Actor in your level. Your application's **PlayerController** is a safe choice. You can do this by clicking **Add Component** in the Blueprint menu and selecting the **Pixel Streaming Input** component from the dropdown.


<p align="center">
    <img src="Resources\Images\pixelstreaming-add-component.jpg" alt="Adding the Pixel Streaming component">
</p>


**_NOTE:_** Prior to UE 4.27, the PixelStreamingInput Component was automatically added when you loaded the Pixel Streaming plugin. This was problematic, and now requires users to add this to their project themselves, as seen above.
