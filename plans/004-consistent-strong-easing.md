# 004 — Replace weak `easeOut` with the site's established strong curve

- **Status**: DONE (executed & approved 2026-08-24)
- **Commit**: 907098d
- **Severity**: MEDIUM
- **Category**: Easing & duration (cohesion)
- **Estimated scope**: 1 file (`src/Home.jsx`), 5 call sites

## Problem

`src/Home.jsx` has a clear, repeated convention for entrance/exit motion: the strong custom curve
`[0.16, 1, 0.3, 1]`, hand-typed identically at 8 other call sites in this file (`scrollToId`,
`RevealWords`, `About`'s two `motion.div`s, `ServiceCard`, `Services`' heading wrapper,
`StepCard`, `CodeTyping`). Five entrance/exit animations don't follow it — they use framer
motion's built-in `'easeOut'` (a much weaker curve, `cubic-bezier(0.25, 0.46, 0.45, 0.94)`), or
omit `ease` entirely (which defaults to the same weak curve for tween transitions). Per Category
2: "Built-in CSS easings are too weak for deliberate motion." These five are Hero's subtitle and
CTA row (the very first motion the page shows), the AI-implementation card's text-cycling widget,
and the demo form's success/exit cross-fade (the site's one real conversion moment).

Current code:

```jsx
// src/Home.jsx:227-230 — Hero subtitle
<motion.p
  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
  animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
  transition={{ duration: 0.7, ease: 'easeOut', delay: .3 }}
```

```jsx
// src/Home.jsx:237-240 — Hero CTA row
<motion.div
  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
  animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
  transition={{ duration: 0.7, ease: 'easeOut', delay: .4 }}
```

```jsx
// src/Home.jsx:373-379 — ConsoleFeed text cycle (inside the AI Implementation card visual)
<motion.span
  key={shouldReduceMotion ? 'static' : i}
  initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -6 }}
  transition={{ duration: 0.4 }}
```

```jsx
// src/Home.jsx:736-741 — Demo form success message
<motion.p
  key="success"
  initial={{ opacity: 0, y: successEnterY }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
```

```jsx
// src/Home.jsx:745-750 — Demo form exit (form → success cross-fade)
<motion.form
  key="form"
  exit={{ opacity: 0, y: formExitY }}
  transition={{ duration: 0.2, ease: 'easeOut' }}
```

## Target

Swap `ease: 'easeOut'` (or the missing `ease` on the `ConsoleFeed` span) for the established
`[0.16, 1, 0.3, 1]` at all five sites. Only the `ease` value changes — durations, delays, and
every other prop stay exactly as they are:

```jsx
// Hero subtitle
transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: .3 }}

// Hero CTA row
transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: .4 }}

// ConsoleFeed text cycle
transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}

// Demo form success message
transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}

// Demo form exit
transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
```

## Repo conventions to follow

The curve to use is already established in this exact file — see any of these as the exemplar:

```jsx
// src/Home.jsx:290 — About section entrance, already correct
transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
```

If plan 008 (bezier token consolidation) has already been executed, a module-level constant
(likely named `EASE_OUT`) will exist near the top of the file — use that constant instead of the
literal array at all five sites in this plan. If plan 008 has not been executed yet, use the
literal `[0.16, 1, 0.3, 1]` array exactly as shown above, matching the other 8 call sites.

## Steps

1. `src/Home.jsx:230` — change `ease: 'easeOut'` to `ease: [0.16, 1, 0.3, 1]` (Hero subtitle).
2. `src/Home.jsx:240` — same change (Hero CTA row).
3. `src/Home.jsx:378` — change `transition={{ duration: 0.4 }}` to
   `transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}` (`ConsoleFeed`).
4. `src/Home.jsx:737` — change `ease: 'easeOut'` to `ease: [0.16, 1, 0.3, 1]` (demo success).
5. `src/Home.jsx:746` — same change (demo form exit).

## Boundaries

- Do NOT touch the carousel progress bar's `transition={{ duration: 0.2, ease: 'easeOut' }}`
  (`src/Home.jsx:616`) — that one is intentionally left as a simple, snappy curve since it's a
  continuously-retriggered scroll-position indicator, not an entrance/exit. It is out of scope
  for this plan.
- Do NOT touch `RadarPulse` (line 336) or `HandshakeShake`'s ripple rings (line 496) — their bare
  `ease: 'easeOut'` is the *correct* choice there (an expanding, fading ring is a genuine
  "exiting" motion per Category 2's decision order, not a weak-curve violation) — leave them
  alone.
- Do NOT change any `duration`, `delay`, or other transition prop — only `ease`.
- If any of the five current-code excerpts above don't match what's in the file (drift since
  commit `907098d`), STOP and report instead of improvising.

## Verification

- **Mechanical**: `npm run lint` — no new errors.
- **Feel check**: run `npm run dev`.
  - Reload the homepage and watch the hero subtitle/CTA row fade in — it should feel slightly
    snappier/more confident than before (the difference is subtle at these durations; that's
    expected, this is a polish-tier consistency fix, not a dramatic visual change).
  - Scroll to "What We Do", watch the AI Implementation card's console-style text cycle through
    its four lines — the swap between lines should feel consistent with the rest of the page's
    motion character.
  - Scroll to "Schedule a Call", submit the form (or trigger `demoStatus` to `'success'` via
    React DevTools if you don't want to actually submit), and confirm the form-to-success
    cross-fade still works with no visual glitch.
  - In DevTools' Animations panel, set playback to 25% for each of the five transitions above and
    confirm each now uses the four-value cubic-bezier curve, not the built-in `ease-out` keyword.
- **Done when**: all five listed sites use `[0.16, 1, 0.3, 1]` (or the `EASE_OUT` constant from
  plan 008, if that ran first), and the two intentionally-excluded sites (progress bar, ripple
  rings) are unchanged.
