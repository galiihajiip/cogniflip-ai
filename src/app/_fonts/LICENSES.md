# Self-hosted fonts

Fonts from the approved Stitch design (`.stitch/DESIGN.md`), downloaded from Google Fonts on
2026-10-13 and served from this app (no request to Google at runtime).

| File | Family | License |
|---|---|---|
| `plus-jakarta-sans-latin.woff2` | Plus Jakarta Sans, variable 400–800, Latin subset | SIL Open Font License 1.1 |
| `jetbrains-mono-latin.woff2` | JetBrains Mono, variable 400–700, Latin subset | SIL Open Font License 1.1 |
| `material-symbols-outlined-subset.woff2` | Material Symbols Outlined, only the icons in `icon-names.json` | Apache License 2.0 |

## Adding an icon

The icon font only contains the names in `icon-names.json`; any other name renders as plain text.
`tests/unit/ui-icons.test.ts` fails when the app uses a name that is not in the list. To add one:

1. Add the name to `icon-names.json` (sorted).
2. Download a new subset with all names, comma-separated and sorted:
   `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,400,0..1,0&icon_names=<names>&display=block`
   (request it with a modern browser user agent to get WOFF2), and save the `src:` URL's file here.
