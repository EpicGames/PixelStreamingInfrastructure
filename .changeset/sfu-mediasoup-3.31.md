---
'@epicgames-ps/pixelstreaming-sfu': minor
---

Upgrade mediasoup from 3.15.5 to 3.31.0 (#1147). 3.15.5 has no prebuilt worker for Linux kernel 7, so installing the SFU on a kernel 7 host compiled the worker from source; 3.31.0 ships kernel 6 and kernel 7 prebuilts. Hosts on kernel 5 (Debian 11, Amazon Linux 2, Ubuntu 22.04 on its original kernel) no longer have a prebuilt and now compile the worker, and the kernel 7 prebuilt needs glibc 2.38 or newer. mediasoup is held below 3.32, whose new bandwidth estimation drops Firefox viewers to no video layer. The SFU now reserves data channel SCTP stream ids with mediasoup's `allocateSctpStreamId()`, as `getNextSctpStreamId()` no longer exists, and exits on SIGINT/SIGTERM itself, because mediasoup now handles those signals to close its worker and would otherwise leave the SFU running without one.
