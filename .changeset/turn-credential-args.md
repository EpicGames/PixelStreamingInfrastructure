---
'@epicgames-ps/wilbur': patch
---

Fix `--turn-user` and `--turn-pass` in the Windows launch scripts. Both set the literal value `1` instead of reading their argument, and neither shifts past it, so the value is then parsed as the next flag and the script exits with `Unknown arg`. The bash equivalents are correct, so this only affected `common.bat`.
