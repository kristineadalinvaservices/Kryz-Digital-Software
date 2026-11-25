# Official brand assets (required)

Place the **official, approved** Kryz Digital Partners logo files here. Do not create, trace, recolor or regenerate them.

| File | Use |
|---|---|
| `logo-full-light.svg` (or `.png`) | Full logo for light backgrounds (Light theme: onboarding, About) |
| `logo-full-dark.svg` (or `.png`) | Full logo for dark backgrounds (Kryz Signature theme, onboarding hero) |
| `symbol-light.svg` (or `.png`) | Brand symbol for light backgrounds: popup header, sidebar, empty states, **and the source for extension icons** |
| `symbol-dark.svg` (or `.png`) | Brand symbol for dark backgrounds |

PNG sources should be at least 512×512 with a transparent background. After adding files, run `npm run build`. The build renders `icons/icon-16|32|48|128.png` from `symbol-light` using `object-fit: contain` (proportions preserved, no artwork added). Check the 16 px icon by eye; if the guidelines provide a dedicated small-size mark, supply that as `symbol-light`.

Status (2026-11-25): **missing.** Searched the project, Google Drive and Canva; the Kryz Canva templates contain only a "Kryz logo here" placeholder.
