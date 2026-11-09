---
'@epicgames-ps/lib-pixelstreamingsignalling-ue5.6': patch
'@epicgames-ps/wilbur': patch
---

Bound what the signalling server writes to its log. Every message a player sent was written to the log file whole, and the daily file had no size limit, so a client could make the log grow as fast as it could send. Log text and protocol messages longer than 16 KiB are now cut to that length, with their full length noted, and the log files are limited in size and number: by default 14 files of 100 MB, set with `logMaxSize` and `logMaxFiles` in `InitLogging`, or `--log_max_size` and `--log_max_files` in wilbur. Files are now kept by count rather than for 14 days.
