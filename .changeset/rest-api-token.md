---
'@epicgames-ps/wilbur': minor
---

Add optional `--rest_api_token` and `--rest_api_token_file`. When set, every request under `/api`, including `/api/api-definition`, must send the token in an `Authorization: Bearer` header or is refused with 401. Without a token the REST API stays open as before, and the server now warns at startup when `--rest_api` is enabled without one. `GET /api/config` no longer returns the configuration objects whole: ICE server usernames and credentials are replaced with `<redacted>`, and it returns only the ports, subscriber limit, keepalive timeout, peer options and protocol version, no longer the HTTP server and WebSocket options. The player and streamer tokens never covered the REST API, so `/api/config` handed out static TURN credentials that `--player_token` exists to protect.
