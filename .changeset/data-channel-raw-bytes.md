---
"@epicgames-ps/lib-pixelstreamingfrontend-ue5.7": minor
---

Add `'raw'` to the structure vocabulary in to-streamer message types (#608). A field declared as `'raw'` accepts a `Uint8Array` and is written into the message buffer verbatim, enabling custom binary protocols (e.g. UTF-8 strings, packed structs) where the receiving UE side decodes the payload itself. Send via the existing `sendMessageToStreamer` path:

```ts
streamMessageController.toStreamerMessages.set('MyBinaryMsg', { id: 137, structure: ['raw'] });
sendMessageController.sendMessageToStreamer('MyBinaryMsg', [myUint8Array]);
```

Existing structure types and call sites are unchanged.
