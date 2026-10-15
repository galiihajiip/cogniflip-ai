# ADR-004 — Child Data Minimization and Social Privacy

- Status: baseline accepted; deployment-specific review required.
- Date: 2026-10-12.

## Context
Primary users are elementary-school children, while the full product includes profiles, permanent history, community, voice and multiplayer.

## Decision
Collect minimum data; use pseudonymous public handles; keep projects/history private by default; make public leaderboard visibility opt-in where appropriate; do not retain raw audio by default; do not offer unrestricted child-to-child direct messaging by default. Public community, multiplayer, leaderboard and peer voice require authorization, reporting, moderation and privacy gates before enablement.

## Consequences
Some features need review before public launch. Product value must not depend on children publishing personal information. Privacy and account deletion are first-class features.

## Follow-up
Review applicable law, provider terms, consent needs and organization requirements for the actual deployment before live use with children.
