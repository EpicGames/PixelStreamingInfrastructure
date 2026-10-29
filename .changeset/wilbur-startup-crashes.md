---
'@epicgames-ps/wilbur': patch
---

Stop two paths from ending the signalling server. With `--stdin`, the server called `setRawMode` unconditionally, which does not exist when stdin is a pipe or a service, so startup threw. A stdin chunk that named an object property, such as `constructor`, was looked up on the command table and the resulting TypeError ended the process. Both are fixed: raw mode is only set on a terminal, and only the table's own keys are commands. A failed write of the config under `--save` is now logged instead of thrown from the file callback, which also ended the process.
