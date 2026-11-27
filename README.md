# NeonDeck for webOS

A console-style Home screen for rooted LG TVs, built on [CleanYourTV](https://github.com/lasharor/cleanyourtv-WebOS). Matching icons, real video wallpapers, seasonal playlists and a Homebrew app shop run on the TV. Your computer can be switched off after installation.

![NeonDeck Home illustration](docs/images/home.png)

*Browser preview with sample apps and original geometric artwork. TV setup varies.*

- Wallpaper browsing with a left or right preview, optional animated preview and background downloads.
- HD 720p, Full HD 1080p and opt-in 4K downloads where the original video supports them. Lower-resolution files are never enlarged to pretend to be 4K.
- Wallpaper deletion, preview-cache cleanup, app removal and warnings based on actual free TV storage.
- Multiple wallpapers per holiday, configurable Christmas dates and Bulgarian Orthodox Easter timing. New Year and Halloween are optional. Automation starts off.
- Eight colour palettes, icon styles, sizes, outlines, corners, dock opacity, clock size, image fit and dimming.
- One themed shop for the official webOS Homebrew catalogue: browse, install, update, open and remove apps. Commercial streaming apps still require their normal installation and accounts.
- Per-TV credentials, local-only helper services, preserved input labels and saved preferences, installation backup and rollback.

**Preview release. Tested on LG 55UR73003LA, firmware 33.31.75, webOS 25.** Other models need the checks in [Compatibility](docs/COMPATIBILITY.md). Root access, an aarch64 kernel, Node 16.20+ and the reviewed CleanYourTV frontend are required. Developer Mode alone cannot replace Home. This release cannot promise support for every LG TV.

Start with the [illustrated installation guide](docs/INSTALL.md). Read [Privacy](docs/PRIVACY.md), [Recovery](docs/RECOVERY.md) and [validation details](docs/VALIDATION.md) before installing. The public package contains no owner network settings, keys, downloaded wallpaper artwork or videos.

Build and test locally with Python 3.10+ and Node 16.20+:

```sh
python3 build.py
node tests/core.cjs
python3 -m unittest discover -s tests -p 'installer.py'
python3 tools/audit_public.py
```

NeonDeck code is MIT licensed. Upstream licenses and artwork credits are in [THIRD-PARTY.md](THIRD-PARTY.md). This project is independent of LG, Apple, Sony and the services shown.
