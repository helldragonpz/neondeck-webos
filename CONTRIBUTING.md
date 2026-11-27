# Contributing

Use Python 3.10+ for the builder and Node 16.20+ for the TV services. Keep frontend changes ES5 compatible. Do not modify the pinned upstream HTML without reviewing the new version and updating its digest and compatibility policy together.

Run the commands in the README before proposing a change. Use synthetic fixtures for tests. Device testing is separate from unit/browser checks: report which model, firmware and behaviour you actually tested. Do not include IPs, MACs, serial numbers, keys, tokens, account data or copied runtime directories.

For a new compatibility report include model, firmware, webOS version, kernel architecture, Node version, baseline version and a redacted preflight error. For UI reports include the menu path, chosen settings and a screenshot with private information removed. Use artwork you can redistribute in public screenshots.

Keep root actions limited to fixed operations, validate downloads and checksums, preserve foreground apps, and maintain rollback. New sources and new firmware need explicit review rather than an installer bypass.
