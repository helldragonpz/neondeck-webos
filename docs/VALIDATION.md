# Validation for the preview release

Validation date: 27 November 2026. Hardware: LG 55UR73003LA, firmware 33.31.75, webOS 25 / SDK 10.3.2.

| Check | Evidence and limits |
| --- | --- |
| Public installer | Read-only preflight and actual installation completed on the TV |
| Home overlay | Installed, mounted and recovery HTML hashes matched; foreground Home refreshed without a full TV restart |
| Video | Real MP4 playback and release on HDMI handoff verified in prior on-device checks |
| 4K download | Full 7.63-second 3840×2160 H.264/24 fps output verified after a real source download and TV-local conversion; 4K viewing needs owner confirmation |
| App store | Official catalogue loaded; a verified small test game installed, appeared in app-manager, then uninstalled; existing owner apps preserved |
| Browser UI | 30 automated checks for dock, focus, side preview, quality requests, media handoff, seasonal settings, storage, delete confirmation and saved appearance |
| Gallery HTTP | 40 route/authentication/byte-range checks |
| Calendar | 15 seasonal/date-boundary checks, including Orthodox Easter |
| Public-source tests | Synthetic parsing, source boundaries, preparation concurrency, deletion of the last wallpaper, checksum handoff, active/core app protection and installer rejection cases |
| Worker isolation | UID/GID 7779, no effective capabilities and NoNewPrivileges verified |
| Reboot | Earlier configuration survived a full reboot; this revision has not repeated a full TV reboot |

Automated browser previews use fixtures and do not demonstrate hardware 4K playback. Physical remote responsiveness, every streaming app's DRM/account playback, long-term storage behaviour and other TV models need owner testing. No universal compatibility or complete telemetry suppression is claimed.
