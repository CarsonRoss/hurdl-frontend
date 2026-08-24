# 008 — Consolidate the hand-typed easing curve into one constant

- **Status**: DONE (executed & approved 2026-08-24)
- **Commit**: 907098d
- **Severity**: LOW
- **Category**: Cohesion & tokens
- **Estimated scope**: 1 file (`src/Home.jsx`), 1 new constant + up to 13 call-site edits

## Problem

The curve `[0.16, 1, 0.3, 1]` is hand-typed as an identical literal array at 8 separate call
sites in `src/Home.jsx`, with no shared constant. A typo in any one of them would silently
introduce an inconsistency nobody would notice at a glance.

Current occurrences, `src/Home.jsx`:

```
106:    ease: [0.16, 1, 0.3, 1],                                                    (scrollToId)
165:    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: ... }}          (RevealWords)
290:    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}                      (About, heading block)
310:    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: i * 0.08 }}     (About, values list)
413:    ease: [0.16, 1, 0.3, 1],                                                    (CodeTyping)
525:    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: ... }}          (ServiceCard)
553:    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}                      (Services, heading block)
652:    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}                      (StepCard)
```

If plan 004 (weak `easeOut` → strong curve) has already run, 5 more occurrences will exist at the
Hero subtitle, Hero CTA row, `ConsoleFeed`, and the two `DemoSection` cross-fade transitions —
those should be converted too, by the same rule (see Steps).

## Target

Add one module-level constant near the top of the file, after the other top-level constants:

```jsx
const ORANGE = '#F89434'
const NAV_OFFSET = 96
const EASE_OUT = [0.16, 1, 0.3, 1]
```

Then replace every literal `[0.16, 1, 0.3, 1]` in the file with `EASE_OUT`. For example:

```jsx
// before
transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}

// after
transition={{ duration: 0.7, ease: EASE_OUT }}
```

## Repo conventions to follow

This file already declares its shared constants at module scope right after the imports —
`ORANGE` and `NAV_OFFSET` (`src/Home.jsx:23-24`) are the exemplar. `EASE_OUT` belongs in that
same block, following the same naming style (`SCREAMING_SNAKE_CASE`).

## Steps

1. In `src/Home.jsx`, immediately after `const NAV_OFFSET = 96` (line 24), add:
   ```jsx
   const EASE_OUT = [0.16, 1, 0.3, 1]
   ```
2. Run `grep -n "0.16, 1, 0.3, 1" src/Home.jsx` to get the current, authoritative list of every
   occurrence (the line numbers above are a snapshot — trust the live grep output over this
   document if they differ, since plan 004 or other plans may have shifted lines).
3. For every line the grep returns, replace the literal `[0.16, 1, 0.3, 1]` with `EASE_OUT` —
   remove the surrounding `[` `]` brackets along with the numbers, since `EASE_OUT` already is
   the array.
4. Re-run the same grep — it should return zero matches when done (every literal has been
   replaced).

## Boundaries

- Do NOT change any `duration` or `delay` value — only replace the `ease` array literal with the
  constant.
- Do NOT touch the two intentionally-different curves in the file: `RadarPulse`/`HandshakeShake`
  ripple rings use bare `ease: 'easeOut'` (a string, not this array) and the carousel progress
  bar also uses bare `ease: 'easeOut'` — none of those match the `[0.16, 1, 0.3, 1]` grep pattern
  in the first place, so they won't be touched by following Steps 2-4 correctly.
- Do NOT create a separate tokens file or `.css` custom properties for this — a single JS
  constant in this file is proportionate to the file's current size and the fact that no other
  file in this codebase shares Home.jsx's motion code.
- If the grep in Step 2 returns a wildly different count than "8, or 13 if plan 004 already ran"
  (e.g. 0, or 30+), STOP and report instead of improvising — that signals the file has drifted
  further than expected since commit `907098d`.

## Verification

- **Mechanical**: `npm run lint` — no new errors (specifically, no `no-unused-vars` on
  `EASE_OUT` — it must actually be referenced everywhere the grep found). Run
  `grep -c "0.16, 1, 0.3, 1" src/Home.jsx` — must output `0`. Run `grep -c "EASE_OUT" src/Home.jsx`
  — must output `9` or more (1 for the declaration + one per call site).
- **Feel check**: run `npm run dev`, spot-check 2-3 of the affected animations (e.g. the About
  section's scroll-reveal, the "What We Do" heading reveal) — they should look and time exactly
  as they did before this change, since the underlying values are identical, only the reference
  changed.
- **Done when**: zero literal `[0.16, 1, 0.3, 1]` arrays remain in `src/Home.jsx`, every one has
  been replaced with `EASE_OUT`, and the site's motion is visually unchanged.
