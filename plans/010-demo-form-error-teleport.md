# 010 — Transition the demo form's error message into place

- **Status**: DONE (executed & approved 2026-08-24)
- **Commit**: 907098d
- **Severity**: MEDIUM
- **Category**: Missed opportunity (Purpose: preventing a jarring change)
- **Estimated scope**: 1 file (`src/Home.jsx`), one JSX block inside `DemoSection`

## Problem

`DemoSection`'s success path already cross-fades smoothly (`AnimatePresence mode="wait"` around
the form/success swap, `src/Home.jsx:731-810` — this was plan 001's fix, already implemented).
The error path, two lines below the email field inside the still-mounted form, was left out: it
pops in and out with a plain `&&` conditional, no transition at all — on the same form, for the
same conversion moment.

Current code, `src/Home.jsx:797-799`:

```jsx
{demoStatus === 'error' && (
  <p className="text-sm text-red-500">Something went wrong. Please try again.</p>
)}
```

## Target

Wrap it in `AnimatePresence` so it fades and rises in/out, matching the character of the
success/exit transitions elsewhere in this same component:

```jsx
<AnimatePresence>
  {demoStatus === 'error' && (
    <motion.p
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="text-sm text-red-500"
    >
      Something went wrong. Please try again.
    </motion.p>
  )}
</AnimatePresence>
```

If plan 008 (easing token consolidation) has already run, use `EASE_OUT` instead of the literal
`[0.16, 1, 0.3, 1]` array.

## Repo conventions to follow

`AnimatePresence` and `motion.p` with an `opacity`/`y` enter-exit pair are already used twice in
this exact component, just a few lines above — that's the pattern to imitate:

```jsx
// src/Home.jsx:735-741 — existing exemplar, same component
<motion.p
  key="success"
  initial={{ opacity: 0, y: successEnterY }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
  className="py-6 text-center text-black/70"
>
  Thanks! We got your request and will reach out shortly.
</motion.p>
```

(Note: that exemplar's own `ease: 'easeOut'` is itself the subject of plan 004 — if plan 004 has
already run, that exemplar will show `[0.16, 1, 0.3, 1]` or `EASE_OUT` instead; use whichever
value plan 004 left there, don't reintroduce the weak curve.)

`AnimatePresence` is already imported at the top of `src/Home.jsx` (line 3) — no new import
needed.

## Steps

1. In `src/Home.jsx`, locate the error block inside `DemoSection`'s form (current lines 797-799,
   between the email field's closing `</div>` and the submit `<button>`).
2. Replace it with the Target code above.
3. Leave the rest of the form — the email field above it, the submit button below it — unchanged.

## Boundaries

- Do NOT touch the success-message or form-exit transitions above this block
  (`src/Home.jsx:731-810`) — they're already correct (aside from the easing swap covered by
  plan 004, which is out of scope here).
- Do NOT change the error copy or the conditions under which `demoStatus` becomes `'error'`
  (that logic lives in `handleDemoSubmit`, in the parent `Home` component) — motion/markup only.
- Note this `AnimatePresence` is nested inside the form, which is itself inside the outer
  `AnimatePresence mode="wait"` that swaps the whole form for the success message
  (`src/Home.jsx:734`). Nested `AnimatePresence` components are supported by framer-motion and
  do not need `mode="wait"` here (there's only ever zero or one error message, not two competing
  children) — do not add `mode="wait"` to this new nested one.
- If the current code at `src/Home.jsx:797-799` doesn't match what's shown above (drift since
  commit `907098d`), STOP and report instead of improvising.

## Verification

- **Mechanical**: `npm run lint` — no new errors.
- **Feel check**: run `npm run dev`, scroll to "Schedule a Call". Trigger the error state (e.g.
  temporarily break the fetch URL, or use React DevTools to set the `Home` component's
  `demoStatus` state to `'error'` directly) — confirm the message fades and rises into place
  rather than popping in. Change it back to `'idle'` — confirm it fades back out rather than
  disappearing instantly.
  - In DevTools' Animations panel, set playback to 25% and confirm the enter/exit both ease
    smoothly using the curve from Repo conventions.
- **Done when**: the error message animates in and out with the same character as the
  success/exit transitions in the same form, and normal form submission (success path) is
  unaffected.
