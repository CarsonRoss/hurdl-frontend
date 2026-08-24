# 002 — Guard the services carousel against rapid-click interruption

- **Status**: DONE (executed & approved 2026-08-24)
- **Commit**: 907098d
- **Severity**: HIGH
- **Category**: Interruptibility
- **Estimated scope**: 1 file (`src/Home.jsx`), the `ServiceCarousel` function

## Problem

`ServiceCarousel` in `src/Home.jsx` drives its Prev/Next buttons with a raw native
`scrollBy({ behavior: 'smooth' })` call and no in-flight guard. Clicking either arrow twice in
quick succession fires two overlapping smooth-scroll calls; browsers do not reliably queue or
retarget these consistently (this was empirically observed during manual testing — a second
rapid click sometimes produces no visible movement at all, other times a partial/short scroll).
This is the site's main "What We Do" section, seen by most visitors who scroll past the hero.

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

  return (
    <div>
      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {SERVICES.map((service, i) => (
          <div key={service.title} data-carousel-card className="w-[78vw] shrink-0 snap-start sm:w-[340px]">
            <ServiceCard service={service} index={i} />
          </div>
        ))}
      </div>

      <div className="mt-7 flex items-center gap-4">
        <div className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-black/[0.08]">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-[#F89434]"
            animate={{ width: `${Math.max(progress * 100, 8)}%` }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          />
        </div>
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
      </div>
    </div>
  )
}
```

## Target

`scrollByCard` ignores new calls while a scroll it started is still settling, using a ref flag
cleared by the native `scrollend` event with a timeout fallback (some older browsers lack
`scrollend`):

```jsx
const scrollByCard = (dir) => {
  const el = scrollerRef.current
  if (!el || isScrollingRef.current) return
  const card = el.querySelector('[data-carousel-card]')
  const amount = card ? card.getBoundingClientRect().width + 20 : 320

  isScrollingRef.current = true
  const clearFlag = () => {
    isScrollingRef.current = false
  }
  el.addEventListener('scrollend', clearFlag, { once: true })
  window.setTimeout(clearFlag, 700) // fallback for browsers without `scrollend`

  el.scrollBy({ left: dir * amount, behavior: 'smooth' })
}
```

Only the guard is added — the actual scroll mechanics, progress tracking, and JSX markup are
unchanged by this plan.

## Repo conventions to follow

This file already has a precedent for "don't let overlapping motion fight itself": `scrollToId`
(`src/Home.jsx:93-117`) starts a framer-motion `animate()` call driving `window.scrollY` and
explicitly cancels it if the user scrolls or touches mid-flight:

```jsx
// src/Home.jsx:104-116 — existing exemplar
const controls = animate(window.scrollY, targetY, {
  duration: 0.9,
  ease: [0.16, 1, 0.3, 1],
  onUpdate: (v) => window.scrollTo({ top: v, behavior: 'instant' }),
})

const cancel = () => controls.stop()
window.addEventListener('wheel', cancel, { once: true, passive: true })
window.addEventListener('touchstart', cancel, { once: true, passive: true })
controls.then(() => {
  window.removeEventListener('wheel', cancel)
  window.removeEventListener('touchstart', cancel)
})
```

This plan applies the same spirit (guard against overlapping motion) but with a simpler
mechanism appropriate for native `scrollBy`, since there's no cancel-and-restart need here —
just "ignore clicks until the current scroll settles."

## Steps

1. In `src/Home.jsx`, inside `ServiceCarousel` (starts at line 566), add a new ref right after
   `const scrollerRef = useRef(null)`:
   ```jsx
   const isScrollingRef = useRef(false)
   ```
2. Replace the body of `scrollByCard` (current lines ~590-596) with the Target code above.
3. Leave everything else in `ServiceCarousel` — `updateProgress`, the scroll/resize effect, the
   JSX — untouched.

## Boundaries

- Do NOT touch the progress bar's `width` animation (`src/Home.jsx:611-618`) — that's plan 003.
- Do NOT touch `scrollToId` or any other component.
- Do NOT add a new dependency to detect `scrollend` support — the `setTimeout` fallback is
  sufficient; do not add a polyfill.
- If plan 005 (reduced-motion carousel scroll) has already been executed, this plan's edit
  should compose cleanly with it — both touch `scrollByCard` but on different lines (the guard
  wraps the whole function; plan 005 only changes the `behavior` value passed to `scrollBy`).
- If the current code at `src/Home.jsx:566-596` doesn't match what's shown above (drift since
  commit `907098d`), STOP and report instead of improvising.

## Verification

- **Mechanical**: `npm run lint` — no new errors introduced (the file will still trip the
  pre-existing `'motion' is defined but never used` rule from `eslint-plugin-react-hooks`'s
  interaction with this project's ESLint config; that is not a regression, ignore it).
- **Feel check**: run `npm run dev`, open the site, scroll to the "What We Do" carousel.
  - Click the Next arrow rapidly 4-5 times in under a second. Confirm the carousel advances a
    reasonable number of cards (it's fine if it ignores some clicks — the point is it never gets
    stuck, never scrolls a fraction of a card, and the progress bar always ends up matching the
    actual final scroll position).
  - Click Next once, wait for it to fully settle, click Next again — confirm normal single-click
    behavior is unaffected (this must still work exactly as before).
  - In DevTools' Animations/Performance panel (or just by eye), confirm there's no visible
    "double scroll" or backward jump when clicking rapidly.
- **Done when**: rapid-clicking either arrow never desyncs the carousel from its progress bar,
  and a single click still scrolls smoothly by exactly one card as before.
