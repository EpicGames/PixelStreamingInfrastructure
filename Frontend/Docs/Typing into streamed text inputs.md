# Typing into streamed inputs

Since [PR564](https://github.com/EpicGames/PixelStreamingInfrastructure/pull/564) there has been improved support for typing into streamed text widgets from Unreal Engine.

Out the box the following is supported:

- Copy and paste
- Input on mobile
- Input on desktop
- Input using IME to type non-latin (e.g. Chinese, Japanese, Korean etc) characters

**Note:** For this modal to work on **desktop** (mobile will work just fine) you must be using UE Main (eventually UE 5.6) or newer. Older versions of UE will simply not show the modal on Desktop, see the PR mentioned above for more details.

## How it works

Typing into a streamed UE widget works as follows:

- On Desktop the user must be using either hovering mouse mode (e.g. `?HoveringMouse=true` or configured in the settings panel/programmatically) or be using locked mouse mode with software cursor enabled on the UE side so that the pointer remains.
- A user then clicks/taps on the streamed UE text widget.
- An input modal will appear.
- The user can type, copy/paste, or use IME to input into the modal.
- Once the user is done they click/tap confirm and the modal contents are sent to UE to populate the UE text input widget.

## Disabling the modal

Some users may prefer the old input method (with no modal). These users can configure the Pixel Streaming frontend to use `?UseModalForTextInput=false` (default is `true`). This configuration can be done in the url parameters or programmatically.

**Note:** Disabling the modal means IME input, mobile input, and copy and paste will no longer work. Thus, this option is only useful for desktop clients as it will disable input into streamed widgets on touch devices.
