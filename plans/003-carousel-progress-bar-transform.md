# 003 — Animate the carousel progress bar with transform, not width

- **Status**: DONE (executed & approved 2026-08-24)
- **Commit**: 907098d
- **Severity**: HIGH
- **Category**: Performance
- **Estimated scope**: 1 file (`src/Home.jsx`), ~6 lines inside `ServiceCarousel`

## Problem

The services carousel's progress bar animates the CSS `width` property, and it re-renders on
every native `scroll` event fired while the user drags/scrolls the carousel (`updateProgress` is
registered as a `scroll` listener at `src/Home.jsx:581`, `{ passive: true }`, which can fire many
times per second during a drag). Animating `width` forces layout + paint + composite on every one
of those updates — exactly the case Category 5 exists for.

Current code, `src/Home.jsx:611-618`:

```jsx
<div className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-black/[0.08]">
  <motion.div
    className="absolute inset-y-0 left-0 rounded-full bg-[#F89434]"
    animate={{ width: `${Math.max(progress * 100, 8)}%` }}
    transition={{ duration: 0.2, ease: 'easeOut' }}
  />
</div>
```

## Target

Make the bar element full-width from the start, and drive the visible fill with a
`transform: scaleX()` anchored at the left edge instead of resizing `width`:

```jsx
<div className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-black/[0.08]">
  <motion.div
    className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-[#F89434]"
    animate={{ scaleX: Math.max(progress, 0.08) }}
    transition={{ duration: 0.2, ease: 'easeOut' }}
  />
</div>
```

`origin-left` is Tailwind's utility for `transform-origin: left` — required so the bar grows from
the left edge (matching the old `width` behavior) instead of from center (the default transform
origin). `Math.max(progress, 0.08)` replaces `Math.max(progress * 100, 8)` — same 8%-minimum-width
floor, expressed as a 0-1 scale factor instead of a percentage.

## Repo conventions to follow

This codebase doesn't have a shared token file for this pattern, but `scaleX`/`scaleY` as
framer-motion animate targets are already used correctly elsewhere in this exact file — see the
"How We Work" timeline progress line at `src/Home.jsx:709-712`:

```jsx
// src/Home.jsx:709-712 — existing exemplar, same technique
<motion.div
  className="absolute bottom-2 left-4 top-2 w-px origin-top bg-[#F89434] sm:left-5"
  style={{ scaleY: lineProgress }}
/>
```

That element is already a fixed-size bar scaled via `transform` with an explicit `origin-*`
utility — this plan makes the carousel's progress bar follow the identical pattern (just
horizontal instead of vertical).

## Steps

1. In `src/Home.jsx`, locate the progress bar block at lines 611-618 (inside `ServiceCarousel`,
   after the card scroller `<div>` and before the Prev/Next buttons `<div>`).
2. Replace it with the Target code above — three changes: add `w-full origin-left` to the
   `motion.div`'s className (alongside the existing `absolute inset-y-0 left-0 rounded-full
   bg-[#F89434]`), change `animate={{ width: ... }}` to `animate={{ scaleX: ... }}`, and update
   the floor value from `* 100, 8` to plain `progress, 0.08`.
3. Leave the `transition` prop, the outer wrapper `<div>`, and everything else in
   `ServiceCarousel` unchanged.

## Boundaries

- Do NOT touch `scrollByCard`, the click handlers, or the scroll/resize effect — those are
  plans 002 and 005.
- Do NOT change the 8% minimum-visible-fill behavior — only its representation (percent → scale
  factor).
- If the current code at `src/Home.jsx:611-618` doesn't match what's shown above (drift since
  commit `907098d`), STOP and report instead of improvising.

## Verification

- **Mechanical**: `npm run lint` — no new errors (the pre-existing `'motion' is defined but never
  used` lint error is unrelated and not a regression).
- **Feel check**: run `npm run dev`, scroll to the "What We Do" carousel, open DevTools →
  Elements, select the orange progress-bar `div`, and drag the carousel horizontally.
  - Confirm the Styles/Computed panel shows the element's `width` staying constant at 100% while
    only its `transform: scaleX(...)` value changes as you scroll.
  - Confirm the bar still visually fills from empty (~8%) at the start to full at the end,
    exactly matching its behavior before this change.
  - In DevTools' Rendering panel, enable "Paint flashing" and drag the carousel — the progress
    bar region should not repaint/flash on every scroll tick the way a `width`-animated element
    would.
- **Done when**: the progress bar's fill is driven entirely by `transform: scaleX()`, visually
  identical to before, with zero layout-triggering property changes during scroll.
