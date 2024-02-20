[new-cirrus](../README.md) / [Exports](../modules.md) / [SFUConnection](../modules/SFUConnection.md) / SFUConnection

# Class: SFUConnection

[SFUConnection](../modules/SFUConnection.md).SFUConnection

A SFU connection to the signalling server.
An SFU can act as both a streamer and a player. It can subscribe to
streamers like a player, and other players can subscribe to the sfu.
Therefore the SFU will have a streamer id and a player id and be
registered in both streamer registries and player registries.

Interesting internals:
playerId: The player id of this connectiom.
streamerId: The streamer id of this connection.
transport: The ITransport where transport events can be subscribed to
protocol: The SignallingProtocol where signalling messages can be
subscribed to.
streaming: True when the streamer is ready to accept subscriptions.

## Hierarchy

- `EventEmitter`

  ↳ **`SFUConnection`**

## Implements

- [`IPlayer`](../interfaces/PlayerRegistry.IPlayer.md)
- [`IStreamer`](../interfaces/StreamerRegistry.IStreamer.md)
- [`IMessageLogger`](../interfaces/LoggingUtils.IMessageLogger.md)

## Table of contents

### Constructors

- [constructor](SFUConnection.SFUConnection.md#constructor)

### Properties

- [layerPreferenceListener](SFUConnection.SFUConnection.md#layerpreferencelistener)
- [playerId](SFUConnection.SFUConnection.md#playerid)
- [protocol](SFUConnection.SFUConnection.md#protocol)
- [remoteAddress](SFUConnection.SFUConnection.md#remoteaddress)
- [server](SFUConnection.SFUConnection.md#server)
- [streamerDisconnectedListener](SFUConnection.SFUConnection.md#streamerdisconnectedlistener)
- [streamerId](SFUConnection.SFUConnection.md#streamerid)
- [streamerIdChangeListener](SFUConnection.SFUConnection.md#streameridchangelistener)
- [streaming](SFUConnection.SFUConnection.md#streaming)
- [subscribedStreamer](SFUConnection.SFUConnection.md#subscribedstreamer)
- [transport](SFUConnection.SFUConnection.md#transport)
- [captureRejectionSymbol](SFUConnection.SFUConnection.md#capturerejectionsymbol)
- [captureRejections](SFUConnection.SFUConnection.md#capturerejections)
- [defaultMaxListeners](SFUConnection.SFUConnection.md#defaultmaxlisteners)
- [errorMonitor](SFUConnection.SFUConnection.md#errormonitor)

### Methods

- [[captureRejectionSymbol]](SFUConnection.SFUConnection.md#[capturerejectionsymbol])
- [addListener](SFUConnection.SFUConnection.md#addlistener)
- [disconnect](SFUConnection.SFUConnection.md#disconnect)
- [emit](SFUConnection.SFUConnection.md#emit)
- [eventNames](SFUConnection.SFUConnection.md#eventnames)
- [getMaxListeners](SFUConnection.SFUConnection.md#getmaxlisteners)
- [getPlayerInfo](SFUConnection.SFUConnection.md#getplayerinfo)
- [getReadableIdentifier](SFUConnection.SFUConnection.md#getreadableidentifier)
- [getStreamerInfo](SFUConnection.SFUConnection.md#getstreamerinfo)
- [listenerCount](SFUConnection.SFUConnection.md#listenercount)
- [listeners](SFUConnection.SFUConnection.md#listeners)
- [off](SFUConnection.SFUConnection.md#off)
- [on](SFUConnection.SFUConnection.md#on)
- [onEndpointId](SFUConnection.SFUConnection.md#onendpointid)
- [onLayerPreference](SFUConnection.SFUConnection.md#onlayerpreference)
- [onListStreamers](SFUConnection.SFUConnection.md#onliststreamers)
- [onStartStreaming](SFUConnection.SFUConnection.md#onstartstreaming)
- [onStopStreaming](SFUConnection.SFUConnection.md#onstopstreaming)
- [onStreamerDataChannels](SFUConnection.SFUConnection.md#onstreamerdatachannels)
- [onStreamerDisconnected](SFUConnection.SFUConnection.md#onstreamerdisconnected)
- [onStreamerIdChanged](SFUConnection.SFUConnection.md#onstreameridchanged)
- [onSubscribeMessage](SFUConnection.SFUConnection.md#onsubscribemessage)
- [onTransportClose](SFUConnection.SFUConnection.md#ontransportclose)
- [onTransportError](SFUConnection.SFUConnection.md#ontransporterror)
- [onUnsubscribeMessage](SFUConnection.SFUConnection.md#onunsubscribemessage)
- [once](SFUConnection.SFUConnection.md#once)
- [prependListener](SFUConnection.SFUConnection.md#prependlistener)
- [prependOnceListener](SFUConnection.SFUConnection.md#prependoncelistener)
- [rawListeners](SFUConnection.SFUConnection.md#rawlisteners)
- [registerMessageHandlers](SFUConnection.SFUConnection.md#registermessagehandlers)
- [removeAllListeners](SFUConnection.SFUConnection.md#removealllisteners)
- [removeListener](SFUConnection.SFUConnection.md#removelistener)
- [sendMessage](SFUConnection.SFUConnection.md#sendmessage)
- [sendToPlayer](SFUConnection.SFUConnection.md#sendtoplayer)
- [sendToStreamer](SFUConnection.SFUConnection.md#sendtostreamer)
- [setMaxListeners](SFUConnection.SFUConnection.md#setmaxlisteners)
- [subscribe](SFUConnection.SFUConnection.md#subscribe)
- [unsubscribe](SFUConnection.SFUConnection.md#unsubscribe)
- [addAbortListener](SFUConnection.SFUConnection.md#addabortlistener)
- [getEventListeners](SFUConnection.SFUConnection.md#geteventlisteners)
- [getMaxListeners](SFUConnection.SFUConnection.md#getmaxlisteners-1)
- [listenerCount](SFUConnection.SFUConnection.md#listenercount-1)
- [on](SFUConnection.SFUConnection.md#on-1)
- [once](SFUConnection.SFUConnection.md#once-1)
- [setMaxListeners](SFUConnection.SFUConnection.md#setmaxlisteners-1)

## Constructors

### constructor

• **new SFUConnection**(`server`, `ws`, `request`): [`SFUConnection`](SFUConnection.SFUConnection.md)

Construct a new SFU connection.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `server` | [`SignallingServer`](SignallingServer.SignallingServer.md) | The signalling server object that spawned this sfu. |
| `ws` | `WebSocket` | The websocket coupled to this sfu connection. |
| `request` | `IncomingMessage` | - |

#### Returns

[`SFUConnection`](SFUConnection.SFUConnection.md)

#### Overrides

EventEmitter.constructor

#### Defined in

[src/SFUConnection.ts:50](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/12733bc/new_cirrus/src/SFUConnection.ts#L50)

## Properties

### layerPreferenceListener

• `Private` **layerPreferenceListener**: (`message`: `layerPreference`) => `void`

#### Type declaration

▸ (`message`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `message` | `layerPreference` |

##### Returns

`void`

#### Defined in

[src/SFUConnection.ts:41](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/12733bc/new_cirrus/src/SFUConnection.ts#L41)

___

### playerId

• **playerId**: `string`

#### Implementation of

[IPlayer](../interfaces/PlayerRegistry.IPlayer.md).[playerId](../interfaces/PlayerRegistry.IPlayer.md#playerid)

#### Defined in

[src/SFUConnection.ts:35](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/12733bc/new_cirrus/src/SFUConnection.ts#L35)

___

### protocol

• **protocol**: `SignallingProtocol`

#### Implementation of

[IStreamer](../interfaces/StreamerRegistry.IStreamer.md).[protocol](../interfaces/StreamerRegistry.IStreamer.md#protocol)

#### Defined in

[src/SFUConnection.ts:34](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/12733bc/new_cirrus/src/SFUConnection.ts#L34)

___

### remoteAddress

• **remoteAddress**: `undefined` \| `string`

#### Defined in

[src/SFUConnection.ts:38](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/12733bc/new_cirrus/src/SFUConnection.ts#L38)

___

### server

• `Private` **server**: [`SignallingServer`](SignallingServer.SignallingServer.md)

#### Defined in

[src/SFUConnection.ts:32](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/12733bc/new_cirrus/src/SFUConnection.ts#L32)

___

### streamerDisconnectedListener

• `Private` **streamerDisconnectedListener**: () => `void`

#### Type declaration

▸ (): `void`

##### Returns

`void`

#### Defined in

[src/SFUConnection.ts:43](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/12733bc/new_cirrus/src/SFUConnection.ts#L43)

___

### streamerId

• **streamerId**: `string`

#### Implementation of

[IStreamer](../interfaces/StreamerRegistry.IStreamer.md).[streamerId](../interfaces/StreamerRegistry.IStreamer.md#streamerid)

#### Defined in

[src/SFUConnection.ts:36](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/12733bc/new_cirrus/src/SFUConnection.ts#L36)

___

### streamerIdChangeListener

• `Private` **streamerIdChangeListener**: (`newId`: `string`) => `void`

#### Type declaration

▸ (`newId`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `newId` | `string` |

##### Returns

`void`

#### Defined in

[src/SFUConnection.ts:42](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/12733bc/new_cirrus/src/SFUConnection.ts#L42)

___

### streaming

• **streaming**: `boolean`

#### Implementation of

[IStreamer](../interfaces/StreamerRegistry.IStreamer.md).[streaming](../interfaces/StreamerRegistry.IStreamer.md#streaming)

#### Defined in

[src/SFUConnection.ts:37](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/12733bc/new_cirrus/src/SFUConnection.ts#L37)

___

### subscribedStreamer

• **subscribedStreamer**: ``null`` \| [`IStreamer`](../interfaces/StreamerRegistry.IStreamer.md)

#### Implementation of

[IPlayer](../interfaces/PlayerRegistry.IPlayer.md).[subscribedStreamer](../interfaces/PlayerRegistry.IPlayer.md#subscribedstreamer)

#### Defined in

[src/SFUConnection.ts:39](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/12733bc/new_cirrus/src/SFUConnection.ts#L39)

___

### transport

• **transport**: `ITransport`

#### Implementation of

[IStreamer](../interfaces/StreamerRegistry.IStreamer.md).[transport](../interfaces/StreamerRegistry.IStreamer.md#transport)

#### Defined in

[src/SFUConnection.ts:33](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/12733bc/new_cirrus/src/SFUConnection.ts#L33)

___

### captureRejectionSymbol

▪ `Static` `Readonly` **captureRejectionSymbol**: typeof [`captureRejectionSymbol`](PlayerRegistry.PlayerRegistry.md#capturerejectionsymbol)

Value: `Symbol.for('nodejs.rejection')`

See how to write a custom `rejection handler`.

**`Since`**

v13.4.0, v12.16.0

#### Inherited from

EventEmitter.captureRejectionSymbol

#### Defined in

node_modules/@types/node/events.d.ts:402

___

### captureRejections

▪ `Static` **captureRejections**: `boolean`

Value: [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type)

Change the default `captureRejections` option on all new `EventEmitter` objects.

**`Since`**

v13.4.0, v12.16.0

#### Inherited from

EventEmitter.captureRejections

#### Defined in

node_modules/@types/node/events.d.ts:409

___

### defaultMaxListeners

▪ `Static` **defaultMaxListeners**: `number`

By default, a maximum of `10` listeners can be registered for any single
event. This limit can be changed for individual `EventEmitter` instances
using the `emitter.setMaxListeners(n)` method. To change the default
for _all_`EventEmitter` instances, the `events.defaultMaxListeners`property can be used. If this value is not a positive number, a `RangeError`is thrown.

Take caution when setting the `events.defaultMaxListeners` because the
change affects _all_`EventEmitter` instances, including those created before
the change is made. However, calling `emitter.setMaxListeners(n)` still has
precedence over `events.defaultMaxListeners`.

This is not a hard limit. The `EventEmitter` instance will allow
more listeners to be added but will output a trace warning to stderr indicating
that a "possible EventEmitter memory leak" has been detected. For any single`EventEmitter`, the `emitter.getMaxListeners()` and `emitter.setMaxListeners()`methods can be used to
temporarily avoid this warning:

```js
import { EventEmitter } from 'node:events';
const emitter = new EventEmitter();
emitter.setMaxListeners(emitter.getMaxListeners() + 1);
emitter.once('event', () => {
  // do stuff
  emitter.setMaxListeners(Math.max(emitter.getMaxListeners() - 1, 0));
});
```

The `--trace-warnings` command-line flag can be used to display the
stack trace for such warnings.

The emitted warning can be inspected with `process.on('warning')` and will
have the additional `emitter`, `type`, and `count` properties, referring to
the event emitter instance, the event's name and the number of attached
listeners, respectively.
Its `name` property is set to `'MaxListenersExceededWarning'`.

**`Since`**

v0.11.2

#### Inherited from

EventEmitter.defaultMaxListeners

#### Defined in

node_modules/@types/node/events.d.ts:446

___

### errorMonitor

▪ `Static` `Readonly` **errorMonitor**: typeof [`errorMonitor`](PlayerRegistry.PlayerRegistry.md#errormonitor)

This symbol shall be used to install a listener for only monitoring `'error'`events. Listeners installed using this symbol are called before the regular`'error'` listeners are called.

Installing a listener using this symbol does not change the behavior once an`'error'` event is emitted. Therefore, the process will still crash if no
regular `'error'` listener is installed.

**`Since`**

v13.6.0, v12.17.0

#### Inherited from

EventEmitter.errorMonitor

#### Defined in

node_modules/@types/node/events.d.ts:395

## Methods

### [captureRejectionSymbol]

▸ **[captureRejectionSymbol]**(`error`, `event`, `...args`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `error` | `Error` |
| `event` | `string` |
| `...args` | `any`[] |

#### Returns

`void`

#### Implementation of

[IStreamer](../interfaces/StreamerRegistry.IStreamer.md).[[captureRejectionSymbol]](../interfaces/StreamerRegistry.IStreamer.md#[capturerejectionsymbol])

#### Inherited from

EventEmitter.[captureRejectionSymbol]

#### Defined in

node_modules/@types/node/events.d.ts:112

___

### addListener

▸ **addListener**(`eventName`, `listener`): `this`

Alias for `emitter.on(eventName, listener)`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `eventName` | `string` \| `symbol` |
| `listener` | (...`args`: `any`[]) => `void` |

#### Returns

`this`

**`Since`**

v0.1.26

#### Implementation of

[IStreamer](../interfaces/StreamerRegistry.IStreamer.md).[addListener](../interfaces/StreamerRegistry.IStreamer.md#addlistener)

#### Inherited from

EventEmitter.addListener

#### Defined in

node_modules/@types/node/events.d.ts:545

___

### disconnect

▸ **disconnect**(): `void`

#### Returns

`void`

#### Defined in

[src/SFUConnection.ts:179](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/12733bc/new_cirrus/src/SFUConnection.ts#L179)

___

### emit

▸ **emit**(`eventName`, `...args`): `boolean`

Synchronously calls each of the listeners registered for the event named`eventName`, in the order they were registered, passing the supplied arguments
to each.

Returns `true` if the event had listeners, `false` otherwise.

```js
import { EventEmitter } from 'node:events';
const myEmitter = new EventEmitter();

// First listener
myEmitter.on('event', function firstListener() {
  console.log('Helloooo! first listener');
});
// Second listener
myEmitter.on('event', function secondListener(arg1, arg2) {
  console.log(`event with parameters ${arg1}, ${arg2} in second listener`);
});
// Third listener
myEmitter.on('event', function thirdListener(...args) {
  const parameters = args.join(', ');
  console.log(`event with parameters ${parameters} in third listener`);
});

console.log(myEmitter.listeners('event'));

myEmitter.emit('event', 1, 2, 3, 4, 5);

// Prints:
// [
//   [Function: firstListener],
//   [Function: secondListener],
//   [Function: thirdListener]
// ]
// Helloooo! first listener
// event with parameters 1, 2 in second listener
// event with parameters 1, 2, 3, 4, 5 in third listener
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `eventName` | `string` \| `symbol` |
| `...args` | `any`[] |

#### Returns

`boolean`

**`Since`**

v0.1.26

#### Implementation of

[IStreamer](../interfaces/StreamerRegistry.IStreamer.md).[emit](../interfaces/StreamerRegistry.IStreamer.md#emit)

#### Inherited from

EventEmitter.emit

#### Defined in

node_modules/@types/node/events.d.ts:807

___

### eventNames

▸ **eventNames**(): (`string` \| `symbol`)[]

Returns an array listing the events for which the emitter has registered
listeners. The values in the array are strings or `Symbol`s.

```js
import { EventEmitter } from 'node:events';

const myEE = new EventEmitter();
myEE.on('foo', () => {});
myEE.on('bar', () => {});

const sym = Symbol('symbol');
myEE.on(sym, () => {});

console.log(myEE.eventNames());
// Prints: [ 'foo', 'bar', Symbol(symbol) ]
```

#### Returns

(`string` \| `symbol`)[]

**`Since`**

v6.0.0

#### Implementation of

[IStreamer](../interfaces/StreamerRegistry.IStreamer.md).[eventNames](../interfaces/StreamerRegistry.IStreamer.md#eventnames)

#### Inherited from

EventEmitter.eventNames

#### Defined in

node_modules/@types/node/events.d.ts:870

___

### getMaxListeners

▸ **getMaxListeners**(): `number`

Returns the current max listener value for the `EventEmitter` which is either
set by `emitter.setMaxListeners(n)` or defaults to [defaultMaxListeners](SFUConnection.SFUConnection.md#defaultmaxlisteners).

#### Returns

`number`

**`Since`**

v1.0.0

#### Implementation of

[IStreamer](../interfaces/StreamerRegistry.IStreamer.md).[getMaxListeners](../interfaces/StreamerRegistry.IStreamer.md#getmaxlisteners)

#### Inherited from

EventEmitter.getMaxListeners

#### Defined in

node_modules/@types/node/events.d.ts:722

___

### getPlayerInfo

▸ **getPlayerInfo**(): [`IPlayerInfo`](../interfaces/PlayerRegistry.IPlayerInfo.md)

#### Returns

[`IPlayerInfo`](../interfaces/PlayerRegistry.IPlayerInfo.md)

#### Implementation of

[IPlayer](../interfaces/PlayerRegistry.IPlayer.md).[getPlayerInfo](../interfaces/PlayerRegistry.IPlayer.md#getplayerinfo)

#### Defined in

[src/SFUConnection.ts:92](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/12733bc/new_cirrus/src/SFUConnection.ts#L92)

___

### getReadableIdentifier

▸ **getReadableIdentifier**(): `string`

#### Returns

`string`

#### Implementation of

[IMessageLogger](../interfaces/LoggingUtils.IMessageLogger.md).[getReadableIdentifier](../interfaces/LoggingUtils.IMessageLogger.md#getreadableidentifier)

#### Defined in

[src/SFUConnection.ts:72](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/12733bc/new_cirrus/src/SFUConnection.ts#L72)

___

### getStreamerInfo

▸ **getStreamerInfo**(): [`IStreamerInfo`](../interfaces/StreamerRegistry.IStreamerInfo.md)

#### Returns

[`IStreamerInfo`](../interfaces/StreamerRegistry.IStreamerInfo.md)

#### Implementation of

[IStreamer](../interfaces/StreamerRegistry.IStreamer.md).[getStreamerInfo](../interfaces/StreamerRegistry.IStreamer.md#getstreamerinfo)

#### Defined in

[src/SFUConnection.ts:82](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/12733bc/new_cirrus/src/SFUConnection.ts#L82)

___

### listenerCount

▸ **listenerCount**(`eventName`, `listener?`): `number`

Returns the number of listeners listening for the event named `eventName`.
If `listener` is provided, it will return how many times the listener is found
in the list of the listeners of the event.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `eventName` | `string` \| `symbol` | The name of the event being listened for |
| `listener?` | `Function` | The event handler function |

#### Returns

`number`

**`Since`**

v3.2.0

#### Implementation of

[IStreamer](../interfaces/StreamerRegistry.IStreamer.md).[listenerCount](../interfaces/StreamerRegistry.IStreamer.md#listenercount)

#### Inherited from

EventEmitter.listenerCount

#### Defined in

node_modules/@types/node/events.d.ts:816

___

### listeners

▸ **listeners**(`eventName`): `Function`[]

Returns a copy of the array of listeners for the event named `eventName`.

```js
server.on('connection', (stream) => {
  console.log('someone connected!');
});
console.log(util.inspect(server.listeners('connection')));
// Prints: [ [Function] ]
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `eventName` | `string` \| `symbol` |

#### Returns

`Function`[]

**`Since`**

v0.1.26

#### Implementation of

[IStreamer](../interfaces/StreamerRegistry.IStreamer.md).[listeners](../interfaces/StreamerRegistry.IStreamer.md#listeners)

#### Inherited from

EventEmitter.listeners

#### Defined in

node_modules/@types/node/events.d.ts:735

___

### off

▸ **off**(`eventName`, `listener`): `this`

Alias for `emitter.removeListener()`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `eventName` | `string` \| `symbol` |
| `listener` | (...`args`: `any`[]) => `void` |

#### Returns

`this`

**`Since`**

v10.0.0

#### Implementation of

[IStreamer](../interfaces/StreamerRegistry.IStreamer.md).[off](../interfaces/StreamerRegistry.IStreamer.md#off)

#### Inherited from

EventEmitter.off

#### Defined in

node_modules/@types/node/events.d.ts:695

___

### on

▸ **on**(`eventName`, `listener`): `this`

Adds the `listener` function to the end of the listeners array for the
event named `eventName`. No checks are made to see if the `listener` has
already been added. Multiple calls passing the same combination of `eventName`and `listener` will result in the `listener` being added, and called, multiple
times.

```js
server.on('connection', (stream) => {
  console.log('someone connected!');
});
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

By default, event listeners are invoked in the order they are added. The`emitter.prependListener()` method can be used as an alternative to add the
event listener to the beginning of the listeners array.

```js
import { EventEmitter } from 'node:events';
const myEE = new EventEmitter();
myEE.on('foo', () => console.log('a'));
myEE.prependListener('foo', () => console.log('b'));
myEE.emit('foo');
// Prints:
//   b
//   a
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `eventName` | `string` \| `symbol` | The name of the event. |
| `listener` | (...`args`: `any`[]) => `void` | The callback function |

#### Returns

`this`

**`Since`**

v0.1.101

#### Implementation of

[IStreamer](../interfaces/StreamerRegistry.IStreamer.md).[on](../interfaces/StreamerRegistry.IStreamer.md#on)

#### Inherited from

EventEmitter.on

#### Defined in

node_modules/@types/node/events.d.ts:577

___

### onEndpointId

▸ **onEndpointId**(`_message`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `_message` | `endpointId` |

#### Returns

`void`

#### Defined in

[src/SFUConnection.ts:228](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/12733bc/new_cirrus/src/SFUConnection.ts#L228)

___

### onLayerPreference

▸ **onLayerPreference**(`message`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | `layerPreference` |

#### Returns

`void`

#### Defined in

[src/SFUConnection.ts:185](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/12733bc/new_cirrus/src/SFUConnection.ts#L185)

___

### onListStreamers

▸ **onListStreamers**(`_message`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `_message` | `listStreamers` |

#### Returns

`void`

#### Defined in

[src/SFUConnection.ts:218](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/12733bc/new_cirrus/src/SFUConnection.ts#L218)

___

### onStartStreaming

▸ **onStartStreaming**(`_message`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `_message` | `startStreaming` |

#### Returns

`void`

#### Defined in

[src/SFUConnection.ts:232](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/12733bc/new_cirrus/src/SFUConnection.ts#L232)

___

### onStopStreaming

▸ **onStopStreaming**(`_message`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `_message` | `stopStreaming` |

#### Returns

`void`

#### Defined in

[src/SFUConnection.ts:236](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/12733bc/new_cirrus/src/SFUConnection.ts#L236)

___

### onStreamerDataChannels

▸ **onStreamerDataChannels**(`message`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | `streamerDataChannels` |

#### Returns

`void`

#### Defined in

[src/SFUConnection.ts:223](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/12733bc/new_cirrus/src/SFUConnection.ts#L223)

___

### onStreamerDisconnected

▸ **onStreamerDisconnected**(): `void`

#### Returns

`void`

#### Defined in

[src/SFUConnection.ts:194](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/12733bc/new_cirrus/src/SFUConnection.ts#L194)

___

### onStreamerIdChanged

▸ **onStreamerIdChanged**(`newId`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `newId` | `string` |

#### Returns

`void`

#### Defined in

[src/SFUConnection.ts:189](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/12733bc/new_cirrus/src/SFUConnection.ts#L189)

___

### onSubscribeMessage

▸ **onSubscribeMessage**(`message`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | `subscribe` |

#### Returns

`void`

#### Defined in

[src/SFUConnection.ts:210](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/12733bc/new_cirrus/src/SFUConnection.ts#L210)

___

### onTransportClose

▸ **onTransportClose**(`_event`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `_event` | `CloseEvent` |

#### Returns

`void`

#### Defined in

[src/SFUConnection.ts:205](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/12733bc/new_cirrus/src/SFUConnection.ts#L205)

___

### onTransportError

▸ **onTransportError**(`error`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `error` | `ErrorEvent` |

#### Returns

`void`

#### Defined in

[src/SFUConnection.ts:201](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/12733bc/new_cirrus/src/SFUConnection.ts#L201)

___

### onUnsubscribeMessage

▸ **onUnsubscribeMessage**(`_message`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `_message` | `unsubscribe` |

#### Returns

`void`

#### Defined in

[src/SFUConnection.ts:214](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/12733bc/new_cirrus/src/SFUConnection.ts#L214)

___

### once

▸ **once**(`eventName`, `listener`): `this`

Adds a **one-time**`listener` function for the event named `eventName`. The
next time `eventName` is triggered, this listener is removed and then invoked.

```js
server.once('connection', (stream) => {
  console.log('Ah, we have our first user!');
});
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

By default, event listeners are invoked in the order they are added. The`emitter.prependOnceListener()` method can be used as an alternative to add the
event listener to the beginning of the listeners array.

```js
import { EventEmitter } from 'node:events';
const myEE = new EventEmitter();
myEE.once('foo', () => console.log('a'));
myEE.prependOnceListener('foo', () => console.log('b'));
myEE.emit('foo');
// Prints:
//   b
//   a
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `eventName` | `string` \| `symbol` | The name of the event. |
| `listener` | (...`args`: `any`[]) => `void` | The callback function |

#### Returns

`this`

**`Since`**

v0.3.0

#### Implementation of

[IStreamer](../interfaces/StreamerRegistry.IStreamer.md).[once](../interfaces/StreamerRegistry.IStreamer.md#once)

#### Inherited from

EventEmitter.once

#### Defined in

node_modules/@types/node/events.d.ts:607

___

### prependListener

▸ **prependListener**(`eventName`, `listener`): `this`

Adds the `listener` function to the _beginning_ of the listeners array for the
event named `eventName`. No checks are made to see if the `listener` has
already been added. Multiple calls passing the same combination of `eventName`and `listener` will result in the `listener` being added, and called, multiple
times.

```js
server.prependListener('connection', (stream) => {
  console.log('someone connected!');
});
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `eventName` | `string` \| `symbol` | The name of the event. |
| `listener` | (...`args`: `any`[]) => `void` | The callback function |

#### Returns

`this`

**`Since`**

v6.0.0

#### Implementation of

[IStreamer](../interfaces/StreamerRegistry.IStreamer.md).[prependListener](../interfaces/StreamerRegistry.IStreamer.md#prependlistener)

#### Inherited from

EventEmitter.prependListener

#### Defined in

node_modules/@types/node/events.d.ts:834

___

### prependOnceListener

▸ **prependOnceListener**(`eventName`, `listener`): `this`

Adds a **one-time**`listener` function for the event named `eventName` to the _beginning_ of the listeners array. The next time `eventName` is triggered, this
listener is removed, and then invoked.

```js
server.prependOnceListener('connection', (stream) => {
  console.log('Ah, we have our first user!');
});
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `eventName` | `string` \| `symbol` | The name of the event. |
| `listener` | (...`args`: `any`[]) => `void` | The callback function |

#### Returns

`this`

**`Since`**

v6.0.0

#### Implementation of

[IStreamer](../interfaces/StreamerRegistry.IStreamer.md).[prependOnceListener](../interfaces/StreamerRegistry.IStreamer.md#prependoncelistener)

#### Inherited from

EventEmitter.prependOnceListener

#### Defined in

node_modules/@types/node/events.d.ts:850

___

### rawListeners

▸ **rawListeners**(`eventName`): `Function`[]

Returns a copy of the array of listeners for the event named `eventName`,
including any wrappers (such as those created by `.once()`).

```js
import { EventEmitter } from 'node:events';
const emitter = new EventEmitter();
emitter.once('log', () => console.log('log once'));

// Returns a new Array with a function `onceWrapper` which has a property
// `listener` which contains the original listener bound above
const listeners = emitter.rawListeners('log');
const logFnWrapper = listeners[0];

// Logs "log once" to the console and does not unbind the `once` event
logFnWrapper.listener();

// Logs "log once" to the console and removes the listener
logFnWrapper();

emitter.on('log', () => console.log('log persistently'));
// Will return a new Array with a single function bound by `.on()` above
const newListeners = emitter.rawListeners('log');

// Logs "log persistently" twice
newListeners[0]();
emitter.emit('log');
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `eventName` | `string` \| `symbol` |

#### Returns

`Function`[]

**`Since`**

v9.4.0

#### Implementation of

[IStreamer](../interfaces/StreamerRegistry.IStreamer.md).[rawListeners](../interfaces/StreamerRegistry.IStreamer.md#rawlisteners)

#### Inherited from

EventEmitter.rawListeners

#### Defined in

node_modules/@types/node/events.d.ts:766

___

### registerMessageHandlers

▸ **registerMessageHandlers**(): `void`

#### Returns

`void`

#### Defined in

[src/SFUConnection.ts:102](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/12733bc/new_cirrus/src/SFUConnection.ts#L102)

___

### removeAllListeners

▸ **removeAllListeners**(`event?`): `this`

Removes all listeners, or those of the specified `eventName`.

It is bad practice to remove listeners added elsewhere in the code,
particularly when the `EventEmitter` instance was created by some other
component or module (e.g. sockets or file streams).

Returns a reference to the `EventEmitter`, so that calls can be chained.

#### Parameters

| Name | Type |
| :------ | :------ |
| `event?` | `string` \| `symbol` |

#### Returns

`this`

**`Since`**

v0.1.26

#### Implementation of

[IStreamer](../interfaces/StreamerRegistry.IStreamer.md).[removeAllListeners](../interfaces/StreamerRegistry.IStreamer.md#removealllisteners)

#### Inherited from

EventEmitter.removeAllListeners

#### Defined in

node_modules/@types/node/events.d.ts:706

___

### removeListener

▸ **removeListener**(`eventName`, `listener`): `this`

Removes the specified `listener` from the listener array for the event named`eventName`.

```js
const callback = (stream) => {
  console.log('someone connected!');
};
server.on('connection', callback);
// ...
server.removeListener('connection', callback);
```

`removeListener()` will remove, at most, one instance of a listener from the
listener array. If any single listener has been added multiple times to the
listener array for the specified `eventName`, then `removeListener()` must be
called multiple times to remove each instance.

Once an event is emitted, all listeners attached to it at the
time of emitting are called in order. This implies that any`removeListener()` or `removeAllListeners()` calls _after_ emitting and _before_ the last listener finishes execution
will not remove them from`emit()` in progress. Subsequent events behave as expected.

```js
import { EventEmitter } from 'node:events';
class MyEmitter extends EventEmitter {}
const myEmitter = new MyEmitter();

const callbackA = () => {
  console.log('A');
  myEmitter.removeListener('event', callbackB);
};

const callbackB = () => {
  console.log('B');
};

myEmitter.on('event', callbackA);

myEmitter.on('event', callbackB);

// callbackA removes listener callbackB but it will still be called.
// Internal listener array at time of emit [callbackA, callbackB]
myEmitter.emit('event');
// Prints:
//   A
//   B

// callbackB is now removed.
// Internal listener array [callbackA]
myEmitter.emit('event');
// Prints:
//   A
```

Because listeners are managed using an internal array, calling this will
change the position indices of any listener registered _after_ the listener
being removed. This will not impact the order in which listeners are called,
but it means that any copies of the listener array as returned by
the `emitter.listeners()` method will need to be recreated.

When a single function has been added as a handler multiple times for a single
event (as in the example below), `removeListener()` will remove the most
recently added instance. In the example the `once('ping')`listener is removed:

```js
import { EventEmitter } from 'node:events';
const ee = new EventEmitter();

function pong() {
  console.log('pong');
}

ee.on('ping', pong);
ee.once('ping', pong);
ee.removeListener('ping', pong);

ee.emit('ping');
ee.emit('ping');
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

#### Parameters

| Name | Type |
| :------ | :------ |
| `eventName` | `string` \| `symbol` |
| `listener` | (...`args`: `any`[]) => `void` |

#### Returns

`this`

**`Since`**

v0.1.26

#### Implementation of

[IStreamer](../interfaces/StreamerRegistry.IStreamer.md).[removeListener](../interfaces/StreamerRegistry.IStreamer.md#removelistener)

#### Inherited from

EventEmitter.removeListener

#### Defined in

node_modules/@types/node/events.d.ts:690

___

### sendMessage

▸ **sendMessage**(`message`): `void`

Sends a signalling message to the player.

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | `BaseMessage` |

#### Returns

`void`

#### Implementation of

[IStreamer](../interfaces/StreamerRegistry.IStreamer.md).[sendMessage](../interfaces/StreamerRegistry.IStreamer.md#sendmessage)

#### Defined in

[src/SFUConnection.ts:77](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/12733bc/new_cirrus/src/SFUConnection.ts#L77)

___

### sendToPlayer

▸ **sendToPlayer**(`message`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | `BaseMessage` |

#### Returns

`void`

#### Defined in

[src/SFUConnection.ts:164](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/12733bc/new_cirrus/src/SFUConnection.ts#L164)

___

### sendToStreamer

▸ **sendToStreamer**(`message`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | `BaseMessage` |

#### Returns

`void`

#### Defined in

[src/SFUConnection.ts:149](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/12733bc/new_cirrus/src/SFUConnection.ts#L149)

___

### setMaxListeners

▸ **setMaxListeners**(`n`): `this`

By default `EventEmitter`s will print a warning if more than `10` listeners are
added for a particular event. This is a useful default that helps finding
memory leaks. The `emitter.setMaxListeners()` method allows the limit to be
modified for this specific `EventEmitter` instance. The value can be set to`Infinity` (or `0`) to indicate an unlimited number of listeners.

Returns a reference to the `EventEmitter`, so that calls can be chained.

#### Parameters

| Name | Type |
| :------ | :------ |
| `n` | `number` |

#### Returns

`this`

**`Since`**

v0.3.5

#### Implementation of

[IStreamer](../interfaces/StreamerRegistry.IStreamer.md).[setMaxListeners](../interfaces/StreamerRegistry.IStreamer.md#setmaxlisteners)

#### Inherited from

EventEmitter.setMaxListeners

#### Defined in

node_modules/@types/node/events.d.ts:716

___

### subscribe

▸ **subscribe**(`streamerId`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `streamerId` | `string` |

#### Returns

`void`

#### Defined in

[src/SFUConnection.ts:116](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/12733bc/new_cirrus/src/SFUConnection.ts#L116)

___

### unsubscribe

▸ **unsubscribe**(): `void`

#### Returns

`void`

#### Defined in

[src/SFUConnection.ts:135](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/12733bc/new_cirrus/src/SFUConnection.ts#L135)

___

### addAbortListener

▸ **addAbortListener**(`signal`, `resource`): `Disposable`

Listens once to the `abort` event on the provided `signal`.

Listening to the `abort` event on abort signals is unsafe and may
lead to resource leaks since another third party with the signal can
call `e.stopImmediatePropagation()`. Unfortunately Node.js cannot change
this since it would violate the web standard. Additionally, the original
API makes it easy to forget to remove listeners.

This API allows safely using `AbortSignal`s in Node.js APIs by solving these
two issues by listening to the event such that `stopImmediatePropagation` does
not prevent the listener from running.

Returns a disposable so that it may be unsubscribed from more easily.

```js
import { addAbortListener } from 'node:events';

function example(signal) {
  let disposable;
  try {
    signal.addEventListener('abort', (e) => e.stopImmediatePropagation());
    disposable = addAbortListener(signal, (e) => {
      // Do something when signal is aborted.
    });
  } finally {
    disposable?.[Symbol.dispose]();
  }
}
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `signal` | `AbortSignal` |
| `resource` | (`event`: `Event`) => `void` |

#### Returns

`Disposable`

Disposable that removes the `abort` listener.

**`Since`**

v20.5.0

#### Inherited from

EventEmitter.addAbortListener

#### Defined in

node_modules/@types/node/events.d.ts:387

___

### getEventListeners

▸ **getEventListeners**(`emitter`, `name`): `Function`[]

Returns a copy of the array of listeners for the event named `eventName`.

For `EventEmitter`s this behaves exactly the same as calling `.listeners` on
the emitter.

For `EventTarget`s this is the only way to get the event listeners for the
event target. This is useful for debugging and diagnostic purposes.

```js
import { getEventListeners, EventEmitter } from 'node:events';

{
  const ee = new EventEmitter();
  const listener = () => console.log('Events are fun');
  ee.on('foo', listener);
  console.log(getEventListeners(ee, 'foo')); // [ [Function: listener] ]
}
{
  const et = new EventTarget();
  const listener = () => console.log('Events are fun');
  et.addEventListener('foo', listener);
  console.log(getEventListeners(et, 'foo')); // [ [Function: listener] ]
}
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `emitter` | `EventEmitter` \| `_DOMEventTarget` |
| `name` | `string` \| `symbol` |

#### Returns

`Function`[]

**`Since`**

v15.2.0, v14.17.0

#### Inherited from

EventEmitter.getEventListeners

#### Defined in

node_modules/@types/node/events.d.ts:308

___

### getMaxListeners

▸ **getMaxListeners**(`emitter`): `number`

Returns the currently set max amount of listeners.

For `EventEmitter`s this behaves exactly the same as calling `.getMaxListeners` on
the emitter.

For `EventTarget`s this is the only way to get the max event listeners for the
event target. If the number of event handlers on a single EventTarget exceeds
the max set, the EventTarget will print a warning.

```js
import { getMaxListeners, setMaxListeners, EventEmitter } from 'node:events';

{
  const ee = new EventEmitter();
  console.log(getMaxListeners(ee)); // 10
  setMaxListeners(11, ee);
  console.log(getMaxListeners(ee)); // 11
}
{
  const et = new EventTarget();
  console.log(getMaxListeners(et)); // 10
  setMaxListeners(11, et);
  console.log(getMaxListeners(et)); // 11
}
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `emitter` | `EventEmitter` \| `_DOMEventTarget` |

#### Returns

`number`

**`Since`**

v19.9.0

#### Inherited from

EventEmitter.getMaxListeners

#### Defined in

node_modules/@types/node/events.d.ts:337

___

### listenerCount

▸ **listenerCount**(`emitter`, `eventName`): `number`

A class method that returns the number of listeners for the given `eventName`registered on the given `emitter`.

```js
import { EventEmitter, listenerCount } from 'node:events';

const myEmitter = new EventEmitter();
myEmitter.on('event', () => {});
myEmitter.on('event', () => {});
console.log(listenerCount(myEmitter, 'event'));
// Prints: 2
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `emitter` | `EventEmitter` | The emitter to query |
| `eventName` | `string` \| `symbol` | The event name |

#### Returns

`number`

**`Since`**

v0.9.12

**`Deprecated`**

Since v3.2.0 - Use `listenerCount` instead.

#### Inherited from

EventEmitter.listenerCount

#### Defined in

node_modules/@types/node/events.d.ts:280

___

### on

▸ **on**(`emitter`, `eventName`, `options?`): `AsyncIterableIterator`\<`any`\>

```js
import { on, EventEmitter } from 'node:events';
import process from 'node:process';

const ee = new EventEmitter();

// Emit later on
process.nextTick(() => {
  ee.emit('foo', 'bar');
  ee.emit('foo', 42);
});

for await (const event of on(ee, 'foo')) {
  // The execution of this inner block is synchronous and it
  // processes one event at a time (even with await). Do not use
  // if concurrent execution is required.
  console.log(event); // prints ['bar'] [42]
}
// Unreachable here
```

Returns an `AsyncIterator` that iterates `eventName` events. It will throw
if the `EventEmitter` emits `'error'`. It removes all listeners when
exiting the loop. The `value` returned by each iteration is an array
composed of the emitted event arguments.

An `AbortSignal` can be used to cancel waiting on events:

```js
import { on, EventEmitter } from 'node:events';
import process from 'node:process';

const ac = new AbortController();

(async () => {
  const ee = new EventEmitter();

  // Emit later on
  process.nextTick(() => {
    ee.emit('foo', 'bar');
    ee.emit('foo', 42);
  });

  for await (const event of on(ee, 'foo', { signal: ac.signal })) {
    // The execution of this inner block is synchronous and it
    // processes one event at a time (even with await). Do not use
    // if concurrent execution is required.
    console.log(event); // prints ['bar'] [42]
  }
  // Unreachable here
})();

process.nextTick(() => ac.abort());
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `emitter` | `EventEmitter` | - |
| `eventName` | `string` | The name of the event being listened for |
| `options?` | `StaticEventEmitterOptions` | - |

#### Returns

`AsyncIterableIterator`\<`any`\>

that iterates `eventName` events emitted by the `emitter`

**`Since`**

v13.6.0, v12.16.0

#### Inherited from

EventEmitter.on

#### Defined in

node_modules/@types/node/events.d.ts:258

___

### once

▸ **once**(`emitter`, `eventName`, `options?`): `Promise`\<`any`[]\>

Creates a `Promise` that is fulfilled when the `EventEmitter` emits the given
event or that is rejected if the `EventEmitter` emits `'error'` while waiting.
The `Promise` will resolve with an array of all the arguments emitted to the
given event.

This method is intentionally generic and works with the web platform [EventTarget](https://dom.spec.whatwg.org/#interface-eventtarget) interface, which has no special`'error'` event
semantics and does not listen to the `'error'` event.

```js
import { once, EventEmitter } from 'node:events';
import process from 'node:process';

const ee = new EventEmitter();

process.nextTick(() => {
  ee.emit('myevent', 42);
});

const [value] = await once(ee, 'myevent');
console.log(value);

const err = new Error('kaboom');
process.nextTick(() => {
  ee.emit('error', err);
});

try {
  await once(ee, 'myevent');
} catch (err) {
  console.error('error happened', err);
}
```

The special handling of the `'error'` event is only used when `events.once()`is used to wait for another event. If `events.once()` is used to wait for the
'`error'` event itself, then it is treated as any other kind of event without
special handling:

```js
import { EventEmitter, once } from 'node:events';

const ee = new EventEmitter();

once(ee, 'error')
  .then(([err]) => console.log('ok', err.message))
  .catch((err) => console.error('error', err.message));

ee.emit('error', new Error('boom'));

// Prints: ok boom
```

An `AbortSignal` can be used to cancel waiting for the event:

```js
import { EventEmitter, once } from 'node:events';

const ee = new EventEmitter();
const ac = new AbortController();

async function foo(emitter, event, signal) {
  try {
    await once(emitter, event, { signal });
    console.log('event emitted!');
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Waiting for the event was canceled!');
    } else {
      console.error('There was an error', error.message);
    }
  }
}

foo(ee, 'foo', ac.signal);
ac.abort(); // Abort waiting for the event
ee.emit('foo'); // Prints: Waiting for the event was canceled!
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `emitter` | `_NodeEventTarget` |
| `eventName` | `string` \| `symbol` |
| `options?` | `StaticEventEmitterOptions` |

#### Returns

`Promise`\<`any`[]\>

**`Since`**

v11.13.0, v10.16.0

#### Inherited from

EventEmitter.once

#### Defined in

node_modules/@types/node/events.d.ts:193

▸ **once**(`emitter`, `eventName`, `options?`): `Promise`\<`any`[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `emitter` | `_DOMEventTarget` |
| `eventName` | `string` |
| `options?` | `StaticEventEmitterOptions` |

#### Returns

`Promise`\<`any`[]\>

#### Inherited from

EventEmitter.once

#### Defined in

node_modules/@types/node/events.d.ts:198

___

### setMaxListeners

▸ **setMaxListeners**(`n?`, `...eventTargets`): `void`

```js
import { setMaxListeners, EventEmitter } from 'node:events';

const target = new EventTarget();
const emitter = new EventEmitter();

setMaxListeners(5, target, emitter);
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `n?` | `number` | A non-negative number. The maximum number of listeners per `EventTarget` event. |
| `...eventTargets` | (`EventEmitter` \| `_DOMEventTarget`)[] | - |

#### Returns

`void`

**`Since`**

v15.4.0

#### Inherited from

EventEmitter.setMaxListeners

#### Defined in

node_modules/@types/node/events.d.ts:352
