# Privacy and network behaviour

NeonDeck has no analytics endpoint, account service or remote-control server. Its helpers listen on the TV's loopback interface. Search/download and app actions require a randomly generated per-TV token. Wallpaper media files are intentionally accessible locally without that token so webOS's native media pipeline can play them.

Searching or downloading contacts **MoeWalls** directly over HTTPS. That service sees your public connection address and your search/request. Its page scripts, ads and trackers are not executed. Browsing the shop contacts the **official webOS Homebrew repository**; selected packages may come from GitHub. Installation can fetch the pinned FFmpeg build from **johnvansickle.com**. Normal installed apps continue to contact their own services.

The wallpaper worker drops to a dedicated user with no effective capabilities. App installation/removal uses a separate loopback root helper, restricted to known catalogue packages and fixed actions. Homebrew Channel performs SHA256 package verification. Root access still makes the TV a sensitive device: keep SSH on a trusted network and protect your key.

For LG privacy controls, review optional agreements, viewing-information collection/Live Plus, personalised advertising, home promotions, HbbTV and voice features in your region's settings. CleanYourTV also provides optional debloat controls. Block firmware updates if preserving root is your priority. Removing optional agreements can disable related cloud services.

The public overlay preserves existing privacy settings. It does not copy the original owner's device-specific DNS/firewall configuration to other TVs. The themed Home removes LG promotional content from that screen; that alone does not prove the operating system sends no telemetry. DNS filtering can reduce known endpoints, but encrypted DNS, direct addresses, shared service domains and early boot make “zero LG data while online” an unverified claim. Review network filtering separately and keep a recovery route for services you use.

Private installation data lives on the TV, including its model/firmware profile, generated token, app inventory and preferences. Never upload `/var/lib/tanados-tv*`, `personal-key.js`, your SSH key, known-hosts file or a full diagnostic dump to a public issue. Report only model, firmware, version and a redacted error. Repository checks reject bundled keys, non-loopback addresses and owner paths; runtime data is excluded from source.
