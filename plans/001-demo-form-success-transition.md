# 001 — Cross-fade the demo form into its success message

- **Status**: DONE (reconciled 2026-08-24)
- **Commit**: d0407ad
- **Severity**: MEDIUM
- **Category**: Missed opportunity (Purpose: preventing a jarring change)
- **Estimated scope**: 1 file (`src/LavaHero.jsx`), one JSX block + one import line + one hook call

> **Reconciliation note**: `src/LavaHero.jsx` no longer exists — the site was restructured into
> `src/Home.jsx` in a later redesign. The fix described below is already implemented, in
> `src/Home.jsx:731-810`: `DemoSection` wraps the form/success swap in
> `<AnimatePresence mode="wait">` with `motion.p`/`motion.form` enter/exit transitions. No action
> needed. (Its error-state sibling was *not* covered by this fix — see plan 010.)

## Problem (as originally written, kept for history)

On successful demo-request submission, `LavaHero.jsx` swaps the entire form for a thank-you
message via a plain ternary. React unmounts the `<form>` and mounts the `<p>` in the same
tick — no transition bridges the two states, so the content teleports. This is the site's one
real conversion moment (a visitor just successfully requested a demo) and it currently gets
zero acknowledgment beyond the text change.

Current code, `src/LavaHero.jsx:257-327`:

```jsx
{demoStatus === 'success' ? (
  <p className="mt-8 text-[#f8e7b6]/80">
    Thanks! We got your request and will reach out shortly.
  </p>
) : (
  <form
    name="schedule-demo"
    onSubmit={handleDemoSubmit}
    className="mt-8 space-y-5"
  >
    <input type="hidden" name="form-name" value="schedule-demo" />
    <p className="hidden">
      <label>
        Don&apos;t fill this out: <input name="bot-field" onChange={handleDemoFieldChange} />
      </label>
    </p>

    <div>
      <input
        id="firstName"
        name="firstName"
        type="text"
        required
        value={demoForm.firstName}
        onChange={handleDemoFieldChange}
        className="mt-2 block w-full rounded-lg border border-[#f8e7b6]/25 bg-[#0c0c0c] px-4 py-3 text-[#f8e7b6] outline-none transition placeholder:text-[#f8e7b6]/35 focus:border-[#f8e7b6]/65 focus:ring-2 focus:ring-[#f8e7b6]/15"
        placeholder="First name"
      />
    </div>

    <div>
      <input
        id="lastName"
        name="lastName"
        type="text"
        required
        value={demoForm.lastName}
        onChange={handleDemoFieldChange}
        className="mt-2 block w-full rounded-lg border border-[#f8e7b6]/25 bg-[#0c0c0c] px-4 py-3 text-[#f8e7b6] outline-none transition placeholder:text-[#f8e7b6]/35 focus:border-[#f8e7b6]/65 focus:ring-2 focus:ring-[#f8e7b6]/15"
        placeholder="Last name"
      />
    </div>

    <div>
      <input
        id="email"
        name="email"
        type="email"
        required
        value={demoForm.email}
        onChange={handleDemoFieldChange}
        className="mt-2 block w-full rounded-lg border border-[#f8e7b6]/25 bg-[#0c0c0c] px-4 py-3 text-[#f8e7b6] outline-none transition placeholder:text-[#f8e7b6]/35 focus:border-[#f8e7b6]/65 focus:ring-2 focus:ring-[#f8e7b6]/15"
        placeholder="you@agency.com"
      />
    </div>

    {demoStatus === 'error' && (
      <p className="text-sm text-red-400">
        Something went wrong. Please try again.
      </p>
    )}

    <button
      type="submit"
      disabled={demoStatus === 'submitting'}
      className="mt-2 w-full rounded-lg border border-[#f8e7b6] bg-[#f8e7b6] px-5 py-3 text-sm font-semibold text-black transition hover:bg-transparent hover:text-[#f8e7b6] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {demoStatus === 'submitting' ? 'Sending…' : 'Request Demo'}
    </button>
  </form>
)}
```

Frequency is rare — a given visitor hits this at most once, and only on success — so this
sits in the "can add delight" tier, not the "no animation" tier. The fix is scoped to the
mount/unmount transition only; no field-by-field animation, no change to validation or submit
logic.

## Target

Wrap the branch in Framer Motion's `AnimatePresence` (already a project dependency) with
`mode="wait"` so the form fully exits before the success message enters — no double-exposure.
Exit: fade + 8px upward drift, 200ms, `ease: 'easeOut'`. Enter: fade + 8px settle from below,
300ms, `ease: 'easeOut'` — the same easing token already used for the hero title entrance at
`src/LavaHero.jsx:201` (`transition={{ duration: 0.8, ease: 'easeOut' }}`). Both durations sit
inside the "Modals, drawers" 200–500ms budget from AUDIT.md, which this content swap is
closest to in weight.

`useReducedMotion()` (from `framer-motion`) gates the `y` offsets to `0` when the user prefers
reduced motion, while keeping the opacity cross-fade — movement drops, feedback stays, per
AUDIT.md §6.

```jsx
// target — src/LavaHero.jsx:257-327
<AnimatePresence mode="wait">
  {demoStatus === 'success' ? (
    <motion.p
      key="success"
      initial={{ opacity: 0, y: successEnterY }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="mt-8 text-[#f8e7b6]/80"
    >
      Thanks! We got your request and will reach out shortly.
    </motion.p>
  ) : (
    <motion.form
      key="form"
      exit={{ opacity: 0, y: formExitY }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      name="schedule-demo"
      onSubmit={handleDemoSubmit}
      className="mt-8 space-y-5"
    >
      {/* ...unchanged form contents... */}
    </motion.form>
  )}
</AnimatePresence>
```

Where `successEnterY` and `formExitY` are computed once per render from
`useReducedMotion()`:

```jsx
const shouldReduceMotion = useReducedMotion()
const successEnterY = shouldReduceMotion ? 0 : 8
const formExitY = shouldReduceMotion ? 0 : -8
```

The `<motion.form>` has no `initial`/`animate` props — it is present on first paint (idle
state) and should not fade in on page load; it only needs an `exit` animation for when it
leaves. `AnimatePresence` only animates `exit` for elements it renders on mount without
`initial`, so leave `initial={false}` implicit (default) rather than adding an `animate` prop
that isn't needed.

## Repo conventions to follow

- This file already imports `{ motion } from 'framer-motion'` (`src/LavaHero.jsx:2`) and uses
  it exactly once, for the hero title: `src/LavaHero.jsx:198-210`:
  ```jsx
  <motion.h1
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, ease: 'easeOut' }}
    ...
  >
  ```
  Match this pattern exactly: plain `ease: 'easeOut'` string (not a custom cubic-bezier — this
  repo has no `--ease-*` token file, so don't introduce one for a single-use transition), same
  `{ opacity, y }` shape.
- No `AnimatePresence` or `useReducedMotion` import exists yet in this file — add both to the
  existing import line rather than a new import statement.
- Do not introduce a CSS token file or `--ease-*` custom properties — this codebase's only
  motion vocabulary today is inline Framer Motion props and Tailwind's default `transition`
  utility. Stay consistent with that.

## Steps

1. In `src/LavaHero.jsx:2`, change:
   ```jsx
   import { motion } from 'framer-motion'
   ```
   to:
   ```jsx
   import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
   ```

2. In the component body, immediately after the existing state declaration at
   `src/LavaHero.jsx:87` (`const [demoStatus, setDemoStatus] = useState('idle')`), add:
   ```jsx
   const shouldReduceMotion = useReducedMotion()
   const successEnterY = shouldReduceMotion ? 0 : 8
   const formExitY = shouldReduceMotion ? 0 : -8
   ```

3. Replace the ternary at `src/LavaHero.jsx:257-327` with the `AnimatePresence` block shown in
   Target above:
   - Wrap the existing ternary in `<AnimatePresence mode="wait">...</AnimatePresence>`.
   - Change the success `<p>` to `<motion.p>`, add `key="success"`,
     `initial={{ opacity: 0, y: successEnterY }}`, `animate={{ opacity: 1, y: 0 }}`,
     `transition={{ duration: 0.3, ease: 'easeOut' }}`. Keep its existing `className` and text
     content unchanged.
   - Change the `<form>` to `<motion.form>`, add `key="form"`,
     `exit={{ opacity: 0, y: formExitY }}`, `transition={{ duration: 0.2, ease: 'easeOut' }}`.
     Keep every existing prop (`name`, `onSubmit`, `className`) and all child JSX
     (hidden field, honeypot, three inputs, error message, submit button) byte-for-byte
     unchanged — only the tag name and the three new props change.

## Boundaries

- Do NOT touch `AgencyLogin.jsx`, `WavingHandParticles.jsx`, or any other section of
  `LavaHero.jsx` (hero canvas, "How It Works" section, footer).
- Do NOT change form validation, submit handling, field markup, or any non-motion prop.
- Do NOT add a new dependency — `framer-motion` is already installed.
- Do NOT introduce a CSS token file for this single-use transition.
- If the ternary at `src/LavaHero.jsx:257-327` doesn't match the excerpt above (drift since
  commit `d0407ad`), STOP and report the mismatch instead of improvising.

## Verification

- **Mechanical**: `npm run lint` — expect no new errors. `npm run build` — expect a clean
  Vite build with no console warnings about missing `key` props inside `AnimatePresence`.
- **Feel check**: run `npm run dev`, scroll to the "Schedule a Call" section, fill in the three
  fields with any values, and submit (the `fetch` will hit `/` and may 404 in local dev —
  that's fine, but to see the success state specifically, temporarily force
  `setDemoStatus('success')` in dev tools or via a quick edit, then revert):
  - The form fades and drifts up ~8px as it leaves; it does not vanish instantly.
  - The "Thanks!" message fades and settles in from ~8px below — it should not appear before
    the form has visibly started leaving (confirm `mode="wait"` is working: there is a brief
    moment with neither element fully opaque, not a flash where both are fully visible at
    once).
  - In DevTools' Animations panel, set playback to 10% and confirm the two eases both start
    fast and settle gently (no slow start — that would indicate `ease-in` crept in instead of
    `easeOut`).
  - Toggle `prefers-reduced-motion` in the Rendering panel, retrigger the success state, and
    confirm the opacity cross-fade still happens but neither element drifts vertically.
- **Done when**: submitting the demo form produces a smooth, connected hand-off from form to
  thank-you message with no instant teleport, the transition is imperceptible-to-good under
  reduced motion (opacity only), and `npm run build` / `npm run lint` are clean.
