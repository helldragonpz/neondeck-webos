# Compatibility

| Requirement | Current release |
| --- | --- |
| Hardware tested | LG 55UR73003LA |
| Firmware tested | 33.31.75 |
| webOS tested | webOS 25 / SDK 10.3.2 |
| Access | Root SSH and rooted Homebrew Channel |
| Kernel architecture | aarch64, including a TV with 32-bit ARM userland |
| TV Node runtime | 16.20 or later |
| Baseline | CleanYourTV service 1.6.32, reviewed frontend 1.5.25 |
| Computer | Python 3.10+, OpenSSH; Linux tested |
| Free system space | At least 160 MB before install; more for original 4K sources |

Other models are candidates for testing, not verified support. Root availability, Home takeover and decoder behaviour vary by model and firmware. A successful preflight checks necessary conditions; it does not establish that every HDMI/DRM/remote combination works on a new TV.

The installer accepts the exact reviewed upstream HTML or a previously approved local overlay, and records that TV's model and firmware locally. At boot, hooks decline to apply if either changes. An unknown future frontend is left for review. The standalone converter is SHA256 pinned and needs an aarch64 kernel; older 32-bit-only TVs and Node 8 runtimes are unsupported.

4K is opt-in. The provider verifies actual output resolution, limits conversion to sources no larger than 4096×2160 and rejects oversized or excessively long sources. An advertised “4K” wallpaper may actually offer an 8K original; that original is rejected rather than risking the TV's memory. Its 720p preview may still be usable. A native H.264 4K/24 fps clip was downloaded and verified on the tested TV. Full 4K viewing and every streaming account still need owner testing.

NeonDeck does not replace webOS with Android. Automatic firmware updates should remain disabled if you want to preserve root. Neither this package nor root persistence is guaranteed across a manual firmware update or factory reset.
