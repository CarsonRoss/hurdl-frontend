# 012 — Give the carousel arrows a disabled state at the ends

- **Status**: DONE (executed & approved 2026-08-24)
- **Commit**: 907098d
- **Severity**: LOW
- **Category**: Missed opportunity
- **Estimated scope**: 1 file (`src/Home.jsx`), `ServiceCarousel`

## Problem

The "What We Do" carousel's Prev/Next buttons give no feedback when there's nowhere left to
scroll — clicking "Previous" while already on the first card, or "Next" while already on the
last, is a silent no-op. A visitor who doesn't notice the progress bar has no way to tell the
carousel reached its end versus the button simply not responding.

Current code, `src/Home.jsx:619-636`:

```jsx
<div className="flex shrink-0 gap-2">
  <button
    type="button"
    onClick={() => scrollByCard(-1)}
    aria-label="Previous"
    className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-black/60 transition-colors hover:border-[#F89434]/40 hover:text-[#F89434]"
  >
    <CaretLeft size={16} weight="bold" />
  </button>
  <button
    type="button"
    onClick={() => scrollByCard(1)}
    aria-label="Next"
    className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-black/60 transition-colors hover:border-[#F89434]/40 hover:text-[#F89434]"
  >
    <CaretRight size={16} weight="bold" />
  </button>
</div>
```

The component already tracks scroll position as `progress` (a 0-1 float, `src/Home.jsx:568`,
updated by `updateProgress`) — that's enough to derive disabled state without any new
measurement code.

## Target

Derive `canScrollPrev`/`canScrollNext` from the existing `progress` value, disable the buttons at
the ends, and dim them with a CSS transition (not a snap) so the state change itself doesn't
teleport:

```jsx
const canScrollPrev = progress > 0.02
const canScrollNext = progress < 0.98
```

```jsx
<div className="flex shrink-0 gap-2">
  <button
    type="button"
    onClick={() => scrollByCard(-1)}
    disabled={!canScrollPrev}
    aria-label="Previous"
    className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-black/60 transition-[color,border-color,opacity] duration-200 hover:border-[#F89434]/40 hover:text-[#F89434] disabled:pointer-events-none disabled:opacity-30"
  >
    <CaretLeft size={16} weight="bold" />
  </button>
  <button
    type="button"
    onClick={() => scrollByCard(1)}
    disabled={!canScrollNext}
    aria-label="Next"
    className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-black/60 transition-[color,border-color,opacity] duration-200 hover:border-[#F89434]/40 hover:text-[#F89434] disabled:pointer-events-none disabled:opacity-30"
  >
    <CaretRight size={16} weight="bold" />
  </button>
</div>
```

The `0.02`/`0.98` thresholds (instead of exact `0`/`1`) exist because `progress` is derived from
`scrollLeft`/`scrollWidth` floats that can land at e.g. `0.003` due to sub-pixel scroll snapping
— a hair-trigger `> 0`/`< 1` comparison would flicker the disabled state at the very ends.

## Repo conventions to follow

Tailwind's `disabled:` variant combined with `transition-*` and `duration-200` is already this
codebase's established pattern for disabled-button feedback — see the demo form's submit button:

```jsx
// src/Home.jsx:801-807 — existing exemplar (note: `transition` there is bare/unscoped;
// this plan's arrows use a scoped transition list instead, which is the more correct version
// of the same pattern — see Category 5)
<button
  type="submit"
  disabled={demoStatus === 'submitting'}
  className="mt-2 w-full rounded-full bg-[#F89434] py-3.5 text-sm font-semibold text-white transition hover:bg-[#E0841E] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
>
```

## Steps

1. In `src/Home.jsx`, inside `ServiceCarousel`, after the `progress` state declaration and before
   the `return` statement, add:
   ```jsx
   const canScrollPrev = progress > 0.02
   const canScrollNext = progress < 0.98
   ```
2. Replace the two `<button>` elements (current lines 620-635) with the Target versions above —
   each gains a `disabled` prop and its `className`'s bare `transition-colors` becomes
   `transition-[color,border-color,opacity] duration-200`, plus
   `disabled:pointer-events-none disabled:opacity-30`.

## Boundaries

- Do NOT change `scrollByCard`, `updateProgress`, or the scroll/resize effect — this plan only
  reads the existing `progress` value, it doesn't change how it's computed.
- Do NOT add `disabled:cursor-not-allowed` — `disabled:pointer-events-none` already prevents
  interaction and is enough; a `not-allowed` cursor on a small icon-only nav control reads as
  overly harsh for "you've reached the end," not "this is broken."
- If plan 002 (rapid-click guard) has already run, this plan's `disabled` attribute and that
  plan's `isScrollingRef` guard are complementary, not conflicting — a button can be
  simultaneously "at the end" (disabled by this plan) and "mid-scroll" (guarded by plan 002).
  Leave both checks in place; do not merge them into one condition.
- If the current code at `src/Home.jsx:619-636` doesn't match what's shown above (drift since
  commit `907098d`), STOP and report instead of improvising.

## Verification

- **Mechanical**: `npm run lint` — no new errors.
- **Feel check**: run `npm run dev`, scroll to "What We Do".
  - On load (first card visible), confirm the Previous arrow is visibly dimmed and does nothing
    when clicked; the Next arrow is fully visible and works.
  - Click Next repeatedly until the last card is reached — confirm the Next arrow dims and stops
    responding, while Previous becomes fully visible and functional again.
  - Confirm the dimming itself transitions smoothly (fades over ~200ms) rather than snapping
    instantly between full and 30% opacity.
  - Manually drag-scroll the carousel with a trackpad/touch gesture (not the buttons) all the way
    to the end — confirm the Next button still correctly dims even though it was never clicked
    (proving it's driven by `progress`, not by button-click history).
- **Done when**: both arrows visibly and smoothly disable at their respective ends, re-enable
  when scrolled away from that end, and dragging the carousel directly (not just clicking the
  buttons) keeps the disabled state in sync.
