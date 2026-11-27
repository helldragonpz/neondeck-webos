# Third-party components

| Component | Origin and licence |
| --- | --- |
| Base launcher frontend | [CleanYourTV](https://github.com/lasharor/cleanyourtv-WebOS), service release 1.6.32 / frontend 1.5.25; MIT text retained in `upstream/LICENSE` |
| YouTube, Netflix, Jellyfin vector marks | [Simple Icons](https://simpleicons.org/), CC0 1.0; full text in `frontend/ICONS-LICENSE.md`. Trademarks belong to their owners |
| Other glyphs and geometric documentation artwork | Original NeonDeck artwork, MIT |
| Homebrew app metadata, icons and packages | [webOS Homebrew](https://repo.webosbrew.org/); fetched at runtime. Each app retains its own licence |
| Wallpaper source | [MoeWalls](https://moewalls.com/); runtime access only. Artwork/video is not included or relicensed by this repository. Respect the source and underlying rights |
| Video converter | FFmpeg 7.0.2 ARM64 static build from [John Van Sickle](https://johnvansickle.com/ffmpeg/), downloaded separately by the installer. Its GPLv3 text and build readme remain beside the binary on the TV; see the producer for corresponding source and build details |

Pinned base HTML SHA256:

```text
7bfe584a43c4651e78408258eb3e45dc2074030982a3e1fce4edddb49dce4d34
```

Pinned standalone FFmpeg binary SHA256:

```text
6bb182d0d75d23028db82e9e4f723ca69b853d055698486e6984ddb2c06fb8ce
```

CleanFrame was a visual reference supplied during design. No CleanFrame source or assets are included. No wallpaper videos, app packages or converter binaries are committed here. The documented video-quality baseline is consistent with LG's [webOS 25 media specifications](https://webostv.developer.lge.com/develop/specifications/video-audio-250); actual decoder behaviour still needs device testing. Orthodox Easter dates can be cross-checked with the [OCA Paschal cycle](https://www.oca.org/fs/paschal-cycle).
