# Official brand assets

Source: **Kryz Brand Guidelines v2 (20 Nov 2026)** and logo pack, supplied by the owner on 2026-11-25.

- `source/`: the complete original pack, unmodified (guidelines, SVG code doc, all logo, mark, app icon and website icon files).
- `logo/`: the four files the extension bundles (copied unmodified): `kryz-logo-3d-glow-for-dark.png`, `kryz-logo-3d-for-light.png`, `kryz-mark.svg`, `kryz-mark-3d.svg`. Only put files here that the UI uses; everything in this folder is bundled.
- `icons/`: extension icons. `icon-16/32/48.png` are the exact images embedded in the official `favicon.ico`; `icon-128.png` is the official `kryz-website-icon-512.png` scaled down. The build copies these unchanged into `dist/icons/`.

Never redraw, recolor, stretch or regenerate these files. If the guidelines change, replace the files from the new official pack and rebuild.
