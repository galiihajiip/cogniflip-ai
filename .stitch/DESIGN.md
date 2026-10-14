---
name: Warm Learning Lab
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#464554'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#777586'
  outline-variant: '#c7c4d7'
  surface-tint: '#5148d7'
  primary: '#2a14b4'
  on-primary: '#ffffff'
  primary-container: '#4338ca'
  on-primary-container: '#c1beff'
  inverse-primary: '#c3c0ff'
  secondary: '#855300'
  on-secondary: '#ffffff'
  secondary-container: '#fea619'
  on-secondary-container: '#684000'
  tertiary: '#00414d'
  on-tertiary: '#ffffff'
  tertiary-container: '#005a6a'
  on-tertiary-container: '#4ad5f4'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e3dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#100069'
  on-primary-fixed-variant: '#372abf'
  secondary-fixed: '#ffddb8'
  secondary-fixed-dim: '#ffb95f'
  on-secondary-fixed: '#2a1700'
  on-secondary-fixed-variant: '#653e00'
  tertiary-fixed: '#acedff'
  tertiary-fixed-dim: '#4cd7f6'
  on-tertiary-fixed: '#001f26'
  on-tertiary-fixed-variant: '#004e5c'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 44px
    fontWeight: '800'
    lineHeight: 52px
    letterSpacing: -0.02em
  display-hero-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: 0em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.005em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-code-lg:
    fontFamily: JetBrains Mono
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  label-code-sm:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-ui:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

The design system establishes a welcoming, optimistic, and focused digital environment tailored for young Indonesian students and emerging coders. The aesthetic rejects condescending preschool tropes in favor of an authentic "learning workshop" identity: clean, airy, structured, and infused with tactile warmth.

### Emotional Goals & Atmosphere
- **Inviting & Safe:** Interfaces feel non-intimidating, encouraging trial, experimentation, and playful error recovery without penalty anxiety.
- **Intellectually Energizing:** The environment treats children as capable young inventors and coders. Spaces balance lively feedback with minimal visual noise to protect developing attention spans.
- **Empathetic Companionship:** UI touchpoints integrate FlipBot—an expressive, curious AI robot tutor—through deliberate status rings, supportive speech bubbles, and reactive hint trays.

### Design Movement: Modern Tactile Lab
The system blends modern Scandinavian educational minimalism with subtle tactile depth. Solid surfaces, plump rounded radii, and physical button affordances give digital objects a tangible, toy-like presence while maintaining clean layouts, rigorous contrast standards (WCAG AAA for primary text), and straightforward Indonesian microcopy ("Ayo Coba!", "Keren Sekali!", "Jalankan Kode").

## Colors

The palette balances analytical clarity with warm organic motivation. Every hue serves an explicit behavioral role in the learning loop: instruction, encouragement, verification, and code execution.

### Palette Architecture
- **Primary Indigo (`#4338CA` / `#4F46E5`):** Denotes active learning, structural navigation, primary progression triggers, and master system actions.
- **Secondary Sunlight Amber (`#F59E0B` / `#D97706`):** Reserved for achievements, streak counters, badges, and positive feedback highlights. Never used for structural chrome.
- **Tertiary Cyan & Mint (`#06B6D4` / `#10B981`):** Denotes AI companion activity, "FlipBot is thinking" states, terminal outputs, and passing automated test suites.
- **Neutral Canvas & Surfaces (`#F8FAFC` base, `#FFFFFF` cards, `#0F172A` text):** Porcelain and pearl layers keep screens bright without eye strain. Rich navy text ensures immediate legibility for early readers.

### Semantic Tones & Feedback
- **Success (`#10B981`):** Unit test passed, step complete, reward unlocked.
- **Warning (`#F59E0B`):** Hint available, logic incomplete, network retry.
- **Danger (`#F43F5E`):** Syntax error, runtime exception, reset confirmation.
- **Info (`#0284C7`):** Explanatory tooltips, system definitions, documentation chips.

## Typography

The typographic hierarchy accommodates emerging literacy levels with open counters, distinct glyph differentiation (such as `1`, `l`, and `I`), and balanced line height that keeps dense Indonesian instructional texts readable.

### Font Pairing Strategy
- **Display & Prose:** `Plus Jakarta Sans` provides warm geometric openness, friendly terminals, and an innate cultural synergy with Indonesian digital products. Headlines lean into heavier weights (`700` and `800`) to anchor scanning eyes.
- **Code & Syntax:** `JetBrains Mono` handles block and inline code snippets, parameter tags, and IDE console outputs. Its distinct letter spacing prevents syntax ambiguity for novice programmers.

### Microcopy Guidelines
- Use generous line heights (`1.5` minimum on body copy) to assist tracking across wide tablet screens.
- Keep instructional Indonesian headers actionable and concise (verb-first: "Tulis", "Jalankan", "Periksa").

## Elevation & Depth

Visual hierarchy employs a tactile "layer-cake" model rather than pure digital abstraction. UI elements look pressable, tactile, and distinct from one another.

### Ambient Depth System
- **Ground Floor (`Canvas`):** Warm tinted surface (`#F8FAFC`). Flat, unshadowed.
- **First Tier (`Cards & Modules`):** Pure white (`#FFFFFF`) with a dual-layer soft elevation: `0 2px 4px rgba(15, 23, 42, 0.04), 0 8px 16px rgba(15, 23, 42, 0.04)`. Outlined with a high-durability boundary border (`1.5px solid #E2E8F0`).
- **Tactile Tier (`Buttons & Draggable Code Blocks`):** Interactive blocks feature physical button bottoms using solid border offsets (`box-shadow: 0 4px 0 0 #312E81` for Indigo triggers). On click or touch down, elements translate 2px downward with reduced shadows, offering satisfying tactile feedback.
- **Overlay Tier (`FlipBot Assistant & Modals`):** Floating conversational callouts use elevated diffusion: `0 12px 32px rgba(67, 56, 202, 0.12)`, visually detaching guidance from the editor canvas.

## Shapes

The design system uses deliberate, child-friendly rounding that maintains geometric integrity across coding consoles and logic diagrams.

### Curvature Tokens
- **Standard Controls & Code Brackets:** 8px (`0.5rem`) radius ensures cards, code lines, and standard input boxes retain clarity and clean alignment.
- **Cards, Modals & Code Panels (`rounded-lg`):** 16px (`1rem`) radius softens screen boundaries and creates friendly container cards.
- **FlipBot Dialogue, Badges & Pills (`rounded-xl`):** 24px (`1.5rem`) radius provides welcoming, pill-like contours for reward tags, progress indicators, and AI speech bubbles.

## Components

### Buttons
- **Primary ("Jalankan Kode" / Run Code):** Solid Indigo (`#4338CA`) background, bold white typography, 3D bottom bevel (`0 4px 0 #312E81`). Minimum height: 52px. Active press shifts the container down by 2px with `0 2px 0` shadow.
- **Secondary / Action ("Petunjuk FlipBot" / Hint):** Warm Amber tint (`#FEF3C7`) with Amber border (`#F59E0B`) and amber text (`#B45309`).
- **Ghost:** Transparent background with `#64748B` text, turning to `#F1F5F9` on hover.

### Code Blocks & Visual Scripting Chips
- Encapsulated within high-contrast pills. Keywords, variables, and numbers use distinct pastel background chips with saturated mono text.
- Draggable blocks feature left-aligned tactile grip dots (6 recessed points) and clear indentation guides.

### FlipBot AI Dialogues
- Speech balloons anchored directly to the robot companion avatar.
- White surface, `1.5px` border tinted in Cyan (`#A5F3FC`), accompanied by a soft directional tail pointing to the mascot.
- Integrated quick-action chips at the bottom: "Ulangi Lagi", "Beri Contoh", "Jelaskan Bagian Ini".

### Input Fields & Terminal Console
- **Interactive Inputs:** Minimum height 48px, 12px horizontal padding, `#F8FAFC` background with a 1.5px `#CBD5E1` border. Focused state: 2px ring in primary Indigo with zero blur.
- **Mini IDE Console:** Deep slate background (`#0F172A`) paired with bright mint green output text (`#34D399`) and warning diagnostics in warm amber (`#FBBF24`). Monospace font with 1.6 line height.

### Cards & Lesson Quests
- Card headers feature clear numbered badges ("Langkah 1 dari 5").
- Progress bars utilize continuous rounded capsules: neutral slate track (`#E2E8F0`) with animated fill in glowing Mint Teal (`#10B981`) or Indigo.
- Interactive states feature subtle scaling (`1.01x`) with no jarring color flips.
---

## CogniFlip implementation notes (added in the repository)

- **Status:** approved visual source of truth (D-011, 2026-10-13). Everything above this section is the participant's Google Stitch export (`warm_learning_lab/DESIGN.md`), copied unchanged.
- **Where the tokens live in code:** `src/app/globals.css` (`@theme`). Colour, typography and spacing names match the Stitch Tailwind config, so `bg-surface-container-low`, `text-headline-md`, etc. mean the same as in the exports.
- **Radius:** the exports use Tailwind's default `rounded-2xl` (1rem) and `rounded-3xl` (1.5rem) for cards. The app keeps Tailwind's default radius scale, which reproduces the exported screens.
- **Fonts and icons:** Plus Jakarta Sans, JetBrains Mono and a Material Symbols subset are self-hosted (`src/app/_fonts/`, licences in `LICENSES.md`). No Google Fonts, Tailwind CDN or `lh3.googleusercontent.com` requests at runtime.
- **Logo (2026-10-15):** the Stitch logo was replaced by the participant-supplied logo (`assets/brand/`); header/footer use `public/brand/cogniflip-logo.png`, and the favicon (`src/app/icon.svg`, `icon1.png`, `apple-icon.png`) is the FlipBot head cut from it.
- **Images:** only the CogniFlip logo and one FlipBot illustration (`public/brand/`) are used. The other generated images in the exports contain baked-in UI text (screen IDs, fake scores, "SELAMAT! ANDA MENGUASAI LOGIKA") or inconsistent mascots, so FlipBot is shown with the `smart_toy` tile used throughout the exports instead.
- **Additions for accessibility:** visible focus ring (3px `primary-container`), skip link, mobile menu (the exported header hides navigation below `xl` with no alternative), `prefers-reduced-motion` plus the learner "Kurangi animasi" and "Teks lebih besar" preferences, and status shown with text and icon, never colour alone.
- Content adaptations (claims removed, unavailable features) are listed in `docs/22_STITCH_DESIGN_HANDOFF.md` §Adaptations.
