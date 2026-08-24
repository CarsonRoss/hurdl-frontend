# 005 — Respect reduced motion in the carousel's programmatic scroll

- **Status**: DONE (executed & approved 2026-08-24)
- **Commit**: 907098d
- **Severity**: MEDIUM
- **Category**: Accessibility
- **Estimated scope**: 1 file (`src/Home.jsx`), `ServiceCarousel`

## Problem

`ServiceCarousel`'s Prev/Next buttons always call `scrollBy({ behavior: 'smooth' })`, regardless
of the user's `prefers-reduced-motion` setting. Every other scroll-triggering interaction in this
same file correctly branches on `useReducedMotion()` — this is the one gap.

Current code, `src/Home.jsx:566-596`:

```jsx
function ServiceCarousel() {
  const scrollerRef = useRef(null)
  const [progress, setProgress] = useState(0)

  const updateProgress = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setProgress(max > 0 ? el.scrollLeft / max : 0)
  }, [])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const raf = requestAnimationFrame(updateProgress)
    el.addEventListener('scroll', updateProgress, { passive: true })
    window.addEventListener('resize', updateProgress)
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('scroll', updateProgress)
      window.removeEventListener('resize', updateProgress)
    }
  }, [updateProgress])

  const scrollByCard = (dir) => {
    const el = scrollerRef.current
    if (!el) return
    const card = el.querySelector('[data-carousel-card]')
    const amount = card ? card.getBoundingClientRect().width + 20 : 320
    el.scrollBy({ left: dir * amount, behavior: 'smooth' })
  }
  // ...
```

## Target

Call `useReducedMotion()` inside `ServiceCarousel` and branch the `behavior` value:

```jsx
function ServiceCarousel() {
  const scrollerRef = useRef(null)
  const shouldReduceMotion = useReducedMotion()
  const [progress, setProgress] = useState(0)

  // ...updateProgress and the scroll/resize effect are unchanged...

  const scrollByCard = (dir) => {
    const el = scrollerRef.current
    if (!el) return
    const card = el.querySelector('[data-carousel-card]')
    const amount = card ? card.getBoundingClientRect().width + 20 : 320
    el.scrollBy({ left: dir * amount, behavior: shouldReduceMotion ? 'instant' : 'smooth' })
  }
  // ...
```

## Repo conventions to follow

This exact pattern already exists in this exact file — `scrollToId`
(`src/Home.jsx:93-102`) is the exemplar to imitate:

```jsx
// src/Home.jsx:93-102 — existing exemplar
function scrollToId(id, shouldReduceMotion) {
  const el = document.getElementById(id)
  if (!el) return
  const offset = id === 'top' ? 0 : NAV_OFFSET
  const targetY = Math.max(0, el.getBoundingClientRect().top + window.scrollY - offset)

  if (shouldReduceMotion) {
    window.scrollTo({ top: targetY, behavior: 'instant' })
    return
  }
  // ...
```

`useReducedMotion` is already imported from `framer-motion` at the top of the file
(`src/Home.jsx:7`) — no new import needed.

## Steps

1. In `src/Home.jsx`, inside `ServiceCarousel` (starts at line 566), add
   `const shouldReduceMotion = useReducedMotion()` immediately after
   `const scrollerRef = useRef(null)`.
2. In `scrollByCard`, change the last line from
   `el.scrollBy({ left: dir * amount, behavior: 'smooth' })` to
   `el.scrollBy({ left: dir * amount, behavior: shouldReduceMotion ? 'instant' : 'smooth' })`.
3. Leave `updateProgress`, the scroll/resize effect, and the JSX unchanged.

## Boundaries

- Do NOT touch the progress bar's own transition (plan 003) or add a rapid-click guard
  (plan 002) — this plan only changes the `behavior` value.
- If plan 002 has already added `const isScrollingRef = useRef(false)` and a guard clause to
  `scrollByCard`, add this plan's `shouldReduceMotion` line alongside it (both are separate
  `useRef`/hook calls at the top of the function) and apply this plan's one-line change to the
  `scrollBy` call inside the already-modified function body — do not revert plan 002's guard.
- Do NOT change any other component's reduced-motion handling — every other component in this
  file already branches correctly; this plan closes the one gap in `ServiceCarousel` only.
- If the current code at `src/Home.jsx:566-596` doesn't match what's shown above (drift since
  commit `907098d`), STOP and report instead of improvising.

## Verification

- **Mechanical**: `npm run lint` — no new errors.
- **Feel check**: run `npm run dev`.
  - In Chrome DevTools, open the Rendering panel (Cmd+Shift+P → "Show Rendering"), set "Emulate
    CSS media feature prefers-reduced-motion" to "reduce".
  - Scroll to "What We Do", click the Next arrow — the carousel should jump instantly to the next
    card with no smooth-scroll animation.
  - Reset the emulation to "No emulation" and click Next again — normal smooth-scroll behavior
    should return.
- **Done when**: with `prefers-reduced-motion: reduce` active, the carousel's Prev/Next buttons
  move instantly; with it off, they scroll smoothly exactly as before.
