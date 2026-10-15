# CogniFlip brand assets

- `cogniflip-logo-original.png`: the logo supplied by the participant on 2026-10-15
  ("Friendly Gradient Robot Logo.png", 2172×724, RGB on white). Source of every derived file below.

## Derived files (regenerate with the scripts in `scripts/brand/`, macOS Swift)

| File | How |
|---|---|
| `public/brand/cogniflip-logo.png` (685×200, transparent) | `swiftc -O scripts/brand/logo-cutout.swift -o /tmp/cut && /tmp/cut assets/brand/cogniflip-logo-original.png public/brand/cogniflip-logo.png 0 0 2172 724 200 wide 690` |
| head cut-out (512×512) | `ERASE="600,180,105,90;630,180,75,140" /tmp/cut assets/brand/cogniflip-logo-original.png /tmp/head.png 140 95 535 530 512 square` (the ERASE boxes remove the two "sparkle" strokes; the crop stops before the wordmark) |
| `src/app/icon1.png` (64×64) | `swiftc -O scripts/brand/icon-compose.swift -o /tmp/compose && /tmp/compose /tmp/head.png src/app/icon1.png 64 1.0` |
| `src/app/icon.svg` | SVG wrapper embedding the head cut-out rendered at 128×128 as a PNG data URI (the supplied logo is raster, so the favicon is not a traced vector) |
| `src/app/apple-icon.png` (180×180) | `/tmp/compose /tmp/head.png src/app/apple-icon.png 180 0.84 white` (iOS icons need an opaque background) |

Background removal: near-white pixels connected to the image edge become transparent (white
inside the robot is kept); right of x=690 (the wordmark) every near-white pixel is removed so
letter counters are transparent; a 2 px band is un-matted from white to avoid halos.
