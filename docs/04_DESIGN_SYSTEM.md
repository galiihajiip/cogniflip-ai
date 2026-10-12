# CogniFlip Design System

> Status: starter direction only. The final visual decisions must be explored and approved in Google Stitch, then reflected in `.stitch/DESIGN.md`. After approval, the finalized Stitch design tokens/rationale are the primary visual source of truth; this document retains implementation-specific component and accessibility requirements. Update both when a material design decision changes.

## Brand
- **Name:** CogniFlip
- **Tagline:** Flip the Way You Learn.
- **Descriptor:** AI Learning & Code Lab
- **Voice:** curious, supportive, clear, honest, empowering.
- **Brand idea:** the learner explains, predicts, tests, and revises; AI supports the thinking process.

## Visual principles
1. Calm base canvas with controlled bright accents.
2. Consistent robot mascot states: curious, thinking, encouraging, celebrating.
3. Avoid excessive gradients, random decorative blobs, crowded cards, and generic AI-dashboard styling.
4. Assets reinforce coding/learning rather than compete with instructions.
5. Learning UI and Mini IDE share tokens but may use different information density.

## Proposed starter tokens
Treat these as initial choices to test, not certified accessible colors:
- Ink/navy `#172033` for core text/dark surfaces.
- Accent lime `#C7F36B` for key brand accents.
- Blue `#4F7DE8` for links/information.
- Warm canvas `#F7F6F0` for learning surfaces.
- White `#FFFFFF` for cards and editor surfaces.
- Semantic success/warning/error/info tokens must pair color with text/icon.

Before release, measure text and non-text contrast against applicable WCAG 2.2 AA criteria. Do not assume these token values pass every context.

## Typography and spacing
- Legible sans serif with Indonesian glyph coverage; separate monospace for code.
- Body text comfortable on small screens; avoid tiny labels.
- Limited type scale: display, page title, section title, body, label, caption.
- 4/8px spacing scale, moderate corner radius, sparse elevation, whitespace-based hierarchy.
- Sentence case for Indonesian labels; avoid all-caps except small useful status labels.

## Core components
- Button: primary, secondary, quiet, destructive; clear loading/disabled states.
- Input/textarea: persistent label, description, validation, focus.
- LessonCard: objective, progress, level, action.
- RobotMessage: character identity and accessible chat semantics.
- EvidenceSnippet: exact excerpt plus criterion it supports.
- RubricScore: score/maximum, criterion, reason, expandable evidence.
- FindingCard: severity, provenance, location, explanation, action, verification state.
- StatusBadge: text plus optional icon; color alone is insufficient.
- ProgressPath: completed/current/locked states with text alternatives.
- Dialog: purpose, cancel/confirm, focus management.
- LiveStatus: announce async updates accessibly.
- CodeEditorShell: lazy-loaded editor, explicit language/tool status.
- RoomStatus: pseudonymous participants, connection, turn, mute/leave/report controls.

## Icons and illustrations
Use a consistent icon family and illustrative style. Pair familiar icons with text in child-facing flows. Icon-only controls need accessible names. Prefer optimized local assets or vetted assets; avoid runtime dependencies on random image hosts.

## Motion
- Short, purposeful transitions.
- Honor reduced-motion settings.
- Hover effects are subtle; essential controls remain discoverable on touch.
- Loading communicates ongoing work and supports cancel/retry if relevant.
- No rapid flashing or animation that blocks reading.

## Accessibility gate
Use WCAG 2.2 AA as target reference. Check keyboard navigation, focus visibility/order, labels, error announcements, zoom/reflow, contrast, motion, touch targets, and editor accessibility. Do not assume the editor library itself guarantees accessibility in the integration.
