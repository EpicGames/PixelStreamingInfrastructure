# Cirrus to Wilbur Guide

This is just a small brief to describe the differences between the now deprecated `cirrus` signalling server and the new `wilbur` signalling server.

- Configuration is handled by CLI options or the same options in a `config.json`
- By default web serving is disabled but can be enabled by supplying --serve
- Convenience scripts in `platform_scripts' will append --serve and try to preproduce old cirrus behaviour.
- Frontend will be placed in `www` instead of `Public` when using convenience scripts.
- Messages are now described by protobufs in the [Common](../Common/protobuf/signalling_messages.proto) library.
- The server is built on top of the [Common](../Common) library which is provided as a tool for developers to build their own applications.
- Logs from wilbur are now structured JSON so they can be easily ingested into external tools.
- Messages sent and received are no longer echoed to the terminal by default. The --console_messages argument can control this behaviour.
