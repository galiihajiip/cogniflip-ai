# Google Stitch Design Handoff and Screen Inventory

## Purpose and status
Google Stitch is the primary tool for complete UI/UX design and interactive screen exploration for CogniFlip. This document is a handoff protocol and inventory, not a prompt. The actual visual design must be created and reviewed in Stitch by the participant. Do not fabricate screen links, exported files, screenshots, or approval statuses.

- Design status: `EXPORTED` (2026-10-13; 58 screens, see "Approved Stitch project").
- Approval status: `APPROVED` by the participant on hand-over (D-011).
- Final tokens: `.stitch/DESIGN.md` (Warm Learning Lab).
- Store real approved screen references in `.stitch/references/` and optional exports in `.stitch/exports/`.

## Source-of-truth policy
1. Product intent, functional behavior, accessibility and acceptance rules come from `docs/01_PRODUCT_REQUIREMENTS.md`, `docs/02_PRODUCT_SCOPE.md`, `docs/03_UX_DESIGN_SPEC.md`, and `docs/13_ACCEPTANCE_CRITERIA.md`.
2. After approval, Stitch screen designs/prototypes and `.stitch/DESIGN.md` define the intended visual layout, tokens, interaction presentation, and responsive behavior.
3. Claude Code implements these approved designs in the real application stack. Stitch-generated HTML/code can be a reference or export, but must not blindly replace the application, security boundaries, data/API logic, or test architecture.
4. An attractive prototype does not count as an implemented feature. Every primary interaction must connect to real application state/API or have an explicit, honest unavailable state.
5. If a screen/state is missing, record it in the inventory and resolve it before treating that flow as complete. Do not silently invent an alternate visual system.
6. Record major visual decisions and revisions in the decision log; preserve actual Stitch interaction history according to the participant's Vibe Coding evidence process.

## Workflow

### Stage A — Establish a visual direction
- Start from the brand idea in `docs/04_DESIGN_SYSTEM.md` and the initial `.stitch/DESIGN.md`, but treat these as a brief, not a finished design.
- Explore variants for typography, color, illustration style, density, cards, navigation, and the AI learning companion.
- Choose a direction that is distinctive, accessible, child-friendly, and suitable for an educational coding product rather than a generic SaaS dashboard.
- Update `.stitch/DESIGN.md` with the approved tokens/rationale. Validate token references and contrast; do not assume starter colors pass all contexts.

### Stage B — Design the full screen inventory
Create the listed screens and their critical states, not just a landing page:

| ID | Screen group | Required screens/states | Priority |
|---|---|---|---|
| ST-01 | Public entry | Landing, value proposition, primary CTA, feature discovery, footer | P0 |
| ST-02 | Authentication | Register, login, forgot/reset password, validation, loading, failure | P1 |
| ST-03 | Home | New learner, returning learner, no history, resume learning | P0 |
| ST-04 | Learning path | Path overview, lesson cards, locked/available/completed states | P0 |
| ST-05 | Lesson intro | Concept explanation, example, hint/example expand state | P0 |
| ST-06 | Teach the Robot | Initial explanation, typing, optional voice, submitting, clarification, empty and error state | P0 |
| ST-07 | Assessment results | Valid score, strengths, gap, evidence, hint, insufficient evidence, provider failure | P0 |
| ST-08 | Revision loop | Revised answer, before/after attempt comparison, completion | P0 |
| ST-09 | Predict Before Run | Prediction entry, actual output, comparison, unavailable runtime state | P1 |
| ST-10 | Debug Robot | Challenge, code/context view, submit diagnosis, feedback, retry, completion | P1 |
| ST-11 | Mini IDE | Empty editor, editing, language selector, project context, analyze, running tool, findings, failure, retry | P1 |
| ST-12 | Code review details | Findings grouped by severity, evidence/location, AI vs tool provenance, hint, diff/accept change | P1 |
| ST-13 | Code execution | Queued/running/success/compile error/runtime error/timeout/cancelled/unsupported | P1 |
| ST-14 | Learning history | Empty history, history list, session details, attempt comparison, continue/review | P1 |
| ST-15 | Progress | Topic progress, strengths, practice suggestions, insufficient data | P1 |
| ST-16 | Achievements | Earned/locked badge, mission complete, XP details | P2 |
| ST-17 | Profile/settings | Profile, avatar/handle, accessibility, preferences, privacy, data export/deletion, confirmation | P1 |
| ST-18 | Leaderboard | Weekly/global tab, current user, empty state, low rank without shaming, privacy opt-out | P2 |
| ST-19 | Community feed | Feed, search/filter, empty state, loading, unavailable state | P2 |
| ST-20 | Community post | Detail, create/edit, comments, validation, report, mute/block, moderation feedback | P2 |
| ST-21 | Multiplayer lobby | Create/join room, invite, waiting room, permission/error, full/expired room | P2 |
| ST-22 | Multiplayer room | Participants, turns, challenge, live results, reconnecting/disconnected, leave/report/mute | P2 |
| ST-23 | Multiplayer results | Validated result, score breakdown, XP result, tie/aborted state | P2 |
| ST-24 | Voice Tutor | Microphone permission, recording/listening, transcribing, speaking, stop/cancel, transcript, unsupported browser/fallback | P2 |
| ST-25 | Shared shell and system | Navigation, mobile menu, notifications, confirmation dialog, not found, forbidden, generic error, offline/retry | P0 |

Priority codes identify design and build sequencing, not permission to remove any feature from the full product target.

### Stage C — Connect prototypes
- Connect critical screens into coherent paths, especially ST-01 → ST-04 → ST-05 → ST-06 → ST-07 → ST-08 → completion.
- Connect Mini IDE paths ST-11 → ST-12 and, where supported, ST-13 → revise → re-analyze.
- Connect login → profile → history/progress, and social paths only with the relevant permissions and child-safety states.
- Check that back, cancel, retry, and resume behaviors are represented.
- Ensure mobile and desktop layouts are both designed; do not merely scale a desktop layout down.

### Stage D — Export and hand off
- Save the final approved `DESIGN.md` at `.stitch/DESIGN.md`.
- Save actual screen screenshots or other references under `.stitch/references/` using stable names such as `ST-06-teach-robot-desktop.png` and `ST-06-teach-robot-mobile.png`.
- Optional HTML/code exports go under `.stitch/exports/`. They are references, not proof of functional behavior.
- Record the actual Stitch project/share link below after the participant has one. Do not invent a link.
- Complete the mapping table below before declaring a screen's design finalized.

## Approved Stitch project
- Project title: `CogniFlip` (Stitch export "CogniFlip UI/UX Design Playbook", design system "Warm Learning Lab")
- Project/share URL: `NOT RECORDED` (the participant supplied an export ZIP, not a link)
- Export received: 2026-10-13, `stitch_cogniflip_ui_ux_design_playbook.zip` (SHA-256 `cb68deaa739af2121d346879cd1bcc7ba70bfd999fb5dadd5f83963456767eef`, 58 screens with `code.html` + `screen.png`, plus `warm_learning_lab/DESIGN.md`). The ZIP itself is not committed.
- Design system approved: `YES` (D-011: the participant provided the export and asked for it to be implemented)
- Key screens approved: `YES` (same basis, D-011)
- Desktop/mobile reviewed: desktop references only. **The export contains no mobile screens**; mobile layouts are responsive adaptations of the desktop designs (see Gaps).
- Accessibility/contrast review: implementation-level checks only (focus ring, labels, text + icon status, reduced motion, 390 px reflow). A full contrast audit is `NOT VERIFIED`.
- Last reviewed by participant: 2026-10-13 (export hand-over)
- Stored in the repo: `.stitch/DESIGN.md` (approved tokens + implementation notes) and `.stitch/references/*.webp` (all 58 screenshots, converted from PNG to WebP quality 80 at the original pixel size). The raw Stitch HTML exports were reviewed during implementation and removed from the submission on 2026-10-15: they load the Tailwind CDN and Google-hosted images and contain placeholder marketing claims the product does not make (see Adaptations).

## Screen-to-implementation mapping
Reference screenshots are in `.stitch/references/<name>.webp`.

| Stitch screen (reference name) | App route | Data / API | Status |
|---|---|---|---|
| `beranda_landing_page` | `/` | `GET` integration status (server) | IMPLEMENTED; browser-checked 1280/390 |
| `dashboard_siswa_baru` | `/belajar` | lessons (server), `GET /api/progress` | IMPLEMENTED; browser-checked |
| `st_06_pengenalan_pelajaran_loops` | `/belajar/[lessonId]` | lesson detail (server, learner-safe DTO) | IMPLEMENTED; browser-checked |
| `st_06a_teach_the_robot_mulai_penjelasan` | `/belajar/[lessonId]/jelaskan` (state `awaiting_explanation`) | `POST /api/sessions`, `POST …/actions` | IMPLEMENTED; E2E in browser |
| `st_06b_…_percakapan_aktif`, `st_06c_…_state_klarifikasi` | same route, state `needs_clarification` | `submit` | IMPLEMENTED; E2E in browser |
| `st_06d_…_state_loading` | same route, request in flight / `evaluating` | — | IMPLEMENTED; E2E in browser |
| `st_07_hasil_evaluasi_pemahaman_75_100` | same route, state `assessed` | `revise`, `complete` | IMPLEMENTED; E2E in browser |
| `st_07a_state_insufficient_evidence…` | same route, `awaiting_revision` after an unclear answer | `submit` | IMPLEMENTED; E2E in browser |
| `st_07b_layanan_ai_evaluasi_mengalami_kendala…` | same route, state `recoverable_error` | `submit` (resend) | IMPLEMENTED; checked against a production build with the AI kill switch |
| `st_08_siklus_revisi_jawaban_compare_attempts` | same route, `awaiting_revision` after a score | `submit` | IMPLEMENTED; E2E in browser |
| (completion, no Stitch screen) | same route, state `completed` | comparison + reference explanation | ADAPTED from ST-07/ST-09a styles |
| `st_09_prediksi_output_simulasi_interaktif` | `/misi/[id]` (predict) | `POST /api/missions/[id]/attempts` `predict` | IMPLEMENTED (adapted, see below) |
| `st_09a_hasil_verifikasi_prediksi_refleksi_simulasi` | same route, after `predict` | `predict`, `reflect` | IMPLEMENTED (adapted) |
| `st_10b_state_bug_tertabrak_lumpur…` | `/misi/[id]` (debug) | `diagnose` | IMPLEMENTED (adapted) |
| `st_10_tantangan_modifikasi_kode_live_coding_di_mini_ide` | `/ide` | in-browser Python runner (D-012), `POST /api/code/review` | IMPLEMENTED: "Jalankan" runs Python in the browser; AI review for all languages |
| `st_10a_…_selesai` (5 variants) | — | — | NOT USED: they show passing test runs that require code execution, which is disabled |
| `misi_04`…`misi_08` (teach, respon, hasil, simulation variants) and per-mission `st_09`/`st_09a`/`st_10`/`st_10b` variants | — | — | Used as style references only: the content (if/elif/and/or/not/nested-if missions) does not exist yet |
| (no Stitch screen) `/misi` hub, `/masuk`, `/daftar`, `/profil`, `/perjalanan`, `/peringkat`, `/petunjuk`, `/panduan`, `/privasi`, 404 | — | auth, profile, history, rewards, leaderboard | ADAPTED from the design system (cards, chips, tactile buttons) |

## Adaptations (intentional differences from the exports)
Content in the exports that the product cannot truthfully show was changed (guarded by `tests/unit/ui-copy.test.ts`):
1. Removed "14.200+ penjelajah", "1.420 anak Indonesia…", "Teruji Secara Pedagogis", "dirancang bersama pakar pedagogi", fake accuracy/XP figures and "© 2025" (now 2026).
2. "Uji Nyata / Real Code Runner", "Python 3.11", the simulator arenas, "Jalankan Simulasi" and automatic test results imply code execution. Execution is disabled (ADR-003), so step 3 became **Cocokkan** (compare with an answer key verified with CPython when the content was written), mission output is labelled as coming from a reviewed fixture, and the Mini IDE "Jalankan" button runs Python in the learner's browser only (D-012; other languages show the reason it is unavailable).
3. Voice ("Rekam Suara") is shown as unavailable (no STT provider). Komunitas is not in the navigation (disabled until its safety gate passes).
4. A wrong prediction shows FlipBot's hint first; the correct output is revealed only on request (bounded hint before the answer, `CLAUDE.md` §5).
5. Score widgets show only the deterministic total, per-criterion points and level labels from the API. The exports' "Pemahaman FlipBot 75% (+20%)" meter, per-criterion analysis notes and evidence quotes are not shown because the learner-facing contract does not include them.
6. The robot illustrations with baked-in text were not used (see `.stitch/DESIGN.md` implementation notes).
7. Lesson/mission prerequisites are shown as "Disarankan setelah …" instead of locks, because the server does not enforce lesson order.
8. The mascot name in draft content was changed from "Robi" to "FlipBot" to match the design.

9. **Addition (participant request, 2026-10-14):** the landing hero has a decorative background video (Mixkit item 99786, Mixkit Stock Video Free License; record in `public/media/LICENSES.md`). It is self-hosted (1.45 MB), muted, hidden from assistive technology, shown at 22% opacity under a left-to-right surface gradient so the hero text keeps its contrast, played at 0.6× with a cross-fade between two copies so the loop has no jump, and replaced by a still poster for reduced motion (system or the learner's "Kurangi animasi"), screens under 768 px and data-saver mode.

10. **Logo replaced (participant request, 2026-10-15):** the participant-supplied logo (`assets/brand/cogniflip-logo-original.png`) replaces the Stitch logo in the header and footer; the favicon set is the robot head cut from it (provenance and regeneration steps in `assets/brand/README.md`).

11. **Learning tracks (D-015):** `/belajar` groups 52 lessons into 8 tracks with jump chips and level labels, and lesson pages show the verified output and a "Coba di Mini IDE" link. Built from the existing dashboard and lesson-card styles; the Stitch export has no multi-track design.

## Gaps (need a design decision before further UI work)
- No mobile references: mobile layouts are responsive reflows checked at 390 px.
- No designs for auth, profile/privacy, history, leaderboard, help/guide/privacy pages, the mission hub, completion and 404; these use the design system and should be reviewed by the participant.
- ST-26 privacy screen and any teacher/parent report screens remain undesigned.

## Visual QA before implementation is accepted
- Compare implementation screenshots with the approved Stitch references at agreed viewport sizes.
- Verify layout, hierarchy, typography, component states, spacing, illustrations, and navigation.
- Test mobile reflow and bounded editor scrolling.
- Check focus, keyboard access, labels, contrast, reduced motion, and error announcements.
- Verify every control is wired to a real action and every network feature has relevant states.
- Record intentional deviations and their rationale; otherwise fix visual drift.
- Capture new screenshots after material UI changes and rerun core end-to-end tests.

## Completion definition
The design handoff is complete only after the design system is approved, critical screens and key states exist for desktop/mobile, prototype navigation covers primary user journeys, the mapping table uses actual references and routes, and unresolved design gaps are documented. The feature implementation is separate and must pass its own acceptance criteria and tests.
