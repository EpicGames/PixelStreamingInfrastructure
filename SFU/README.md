# Pixel Streaming Selective Forwarding Unit

The SFU (Selective Forwarding Unit) is a mechanism to allow distributing a single stream out to a large number of peers. This is useful because when peers connect directly to the streamer, resources must be allocated per peer to allow encoding of the stream. This means the resources can be quickly drained after only a handful of peers. The SFU can receive multiple streams using simulcast and selectively forward out streams to remote peers based on their available resources, without requiring to actually re-encode the stream.

## Configuration

Configuration is handled through the single config.js file.

| Name | Type | Default | Description |
|-|-|-|-|
| signallingURL | String | 'http://localhost:8889' | The URL pointing to the signalling server we want to connect to. |
| SFUId | String | 'SFU' | The name this peer will be given that will then be displayed in the streamer list. Peers wishing to receive from this SFU should subscribe to this ID. |
| subscribeStreamerId | String | 'DefaultStreamer' | This is the name of the streamer that this SFU should subscribe to and re-stream. |
| retrySubscribeDelaySecs | Number | 10 | If subscribing to the given streamer fails, wait this many seconds before trying again. |
| mediasoup | Object | | Mediasoup-related configuration options. See below. |

### Mediasoup related configuration options.

| Name | Type | Default | Description |
|-|-|-|-|
| worker | Object | | Worker-related configuration options. See below. |
| router | Object | | Router-related configuration options. See below. |
| webRtcTransport | Object | | WebRTC transport-related configuration options. See below. |

### Worker-related configuration options.

| Name | Type | Default | Description |
|-|-|-|-|
| rtcMinPort | Number | 40000 | Minimun RTC port for ICE, DTLS, RTP, etc. |
| rtcMaxPort | Number | 49999 | Maximum RTC port for ICE, DTLS, RTP, etc. |
| logLevel | String | 'debug' | The log level for the worker. See Mediasoup [docs](https://mediasoup.org/documentation/v3/mediasoup/api/#WorkerLogLevel) |
| logTags | Array&lt;WorkerLogTag&gt; | | The log tags to include in logs. See Mediasoup [docs](https://mediasoup.org/documentation/v3/mediasoup/api/#WorkerLogTag) |

### Router-related configuration options.

| Name | Type | Default | Description |
|-|-|-|-|
| mediaCodecs | Array&lt;RtpCodecCapability&gt; | | Codecs to support. See Mediasoup [docs](https://mediasoup.org/documentation/v3/mediasoup/rtp-parameters-and-capabilities/#RtpCodecCapability) |

### WebRTC transport-related configuration options.

| Name | Type | Default | Description |
|-|-|-|-|
| listenIps | Array&lt;TransportListenIp|String&gt; | | Listening IP address or addresses in order of preference (first one is the preferred one). See Mediasoup [docs](https://mediasoup.org/documentation/v3/mediasoup/api/#TransportListenIp) |
| initialAvailableOutgoingBitrate | Number | Initial available outgoing bitrate (in bps/bits per second). |

## Running

Several scripts are supplied for Windows and Linux in the [platform_scripts](platform_scripts/) folder. These are the easiest way to get the server running under common situations. They can also be used as a reference for new situations.

## Streaming from UE

The best way to fully utilize the SFU is to have a single streamer streaming simulcast to the SFU and then have peers subscribe to the SFU stream.

Launch the streaming app with the following arguments
`-SimulcastParameters="1.0,5000000,20000000,2.0,1000000,5000000,4.0,50000,1000000"`
This tells the Pixel Streaming plugin to stream simulcast with 3 streams, each one scaling video resolution by half. The sequence of values is as follows, `scale_down_factor,min_bitrate,max_bitrate,...repeating for each stream`

When this streams to the SFU, the SFU will detect these 3 streams and then selectively stream these out to connected peers based on their connection quality.

## Running the Docker image

The Docker image needs to know where the signalling server to connect to is. You will need to set the `SIGNALLING_URL` environment variable to the URL for your signalling server. This URL needs to point to the configured SFU port (default 8889).
You will also need to use the `host` network driver on docker because of the way the SFU collects and reports its available ports.
An example for running might be as follows.

```docker run -e SIGNALLING_URL=ws://192.168.1.10:8889 --network="host" ghcr.io/epicgames/pixel-streaming-sfu:5.4```
