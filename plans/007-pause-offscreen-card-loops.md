# 007 — Pause decorative card-visual loops when off-screen

- **Status**: DONE (executed & approved 2026-08-24)
- **Commit**: 907098d
- **Severity**: MEDIUM
- **Category**: Performance
- **Estimated scope**: 1 file (`src/Home.jsx`), 6 components: `RadarPulse`, `ConsoleFeed`,
  `CodeTyping`, `StackLayers`, `ChecklistChips`, `HandshakeShake`

## Problem

The six mini-animations inside the "What We Do" service cards each run a `repeat: Infinity`
loop (or, for `ConsoleFeed`, a `setInterval`). None of them pause when their card scrolls out of
view. Since all 6 cards live inside one horizontally-scrolling carousel
(`src/Home.jsx:566-609`), only 1-3 are visible at any screen width — the rest keep animating,
fully invisible, the entire time. Once the user scrolls past the "What We Do" section entirely,
all 6 keep running for the rest of the page's session. This is a real, cumulative CPU/battery
cost for zero visible benefit, on every single page load.

Current code for all six components, `src/Home.jsx:323-514`:

```jsx
// src/Home.jsx:323-347
function RadarPulse() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {!shouldReduceMotion &&
        [0, 0.7, 1.4].map((delay, i) => (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border"
            style={{ borderColor: 'rgba(248,148,52,0.4)' }}
            initial={{ scale: 0.6, opacity: 0.6 }}
            animate={{ scale: 3.6, opacity: 0 }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeOut', delay }}
          />
        ))}
      <div
        className="relative flex h-12 w-12 items-center justify-center rounded-full"
        style={{ background: 'rgba(248,148,52,0.12)', color: ORANGE }}
      >
        <Compass size={22} weight="bold" />
      </div>
    </div>
  )
}

const AI_LINES = ['Analyzing workflow…', 'Mapping automation points…', 'Deploying AI agent…', 'Workflow automated ✓']

function ConsoleFeed() {
  const shouldReduceMotion = useReducedMotion()
  const [i, setI] = useState(0)

  useEffect(() => {
    if (shouldReduceMotion) return
    const id = setInterval(() => setI((v) => (v + 1) % AI_LINES.length), 1900)
    return () => clearInterval(id)
  }, [shouldReduceMotion])

  return (
    <div className="flex h-full w-full flex-col justify-center gap-2 px-6">
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-black/15" />
        <span className="h-2 w-2 rounded-full bg-black/15" />
        <span className="h-2 w-2 rounded-full bg-black/15" />
      </div>
      <div
        className="rounded-lg bg-white px-3 py-2.5 font-mono text-[12.5px] text-black/70"
        style={{ boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06), 0 8px 20px -14px rgba(0,0,0,0.3)' }}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={shouldReduceMotion ? 'static' : i}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-1"
          >
            {AI_LINES[i]}
            <span className="inline-block h-3.5 w-[2px] animate-pulse" style={{ background: ORANGE }} />
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  )
}

const CODE_LINES = [
  { text: 'function shipFast() {', className: 'text-black/70' },
  { text: '  return outcome;', className: 'text-[#F89434]' },
  { text: '}', className: 'text-black/70' },
]

function CodeTyping() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <div className="flex h-full w-full flex-col justify-center gap-1.5 px-6 font-mono text-[12.5px]">
      {CODE_LINES.map((line, i) => (
        <div key={i} className="overflow-hidden">
          <motion.div
            className={`whitespace-nowrap ${line.className}`}
            style={{ width: `${line.text.length}ch` }}
            initial={shouldReduceMotion ? false : { clipPath: 'inset(0 100% 0 0)' }}
            animate={{ clipPath: 'inset(0 0% 0 0)' }}
            transition={{
              duration: 0.7,
              delay: 0.3 + i * 0.5,
              repeat: Infinity,
              repeatDelay: 2.6,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {line.text}
          </motion.div>
        </div>
      ))}
    </div>
  )
}

function StackLayers() {
  const shouldReduceMotion = useReducedMotion()
  const layers = [0, 1, 2]

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {layers.map((i) => (
        <motion.div
          key={i}
          className="absolute h-20 w-32 rounded-xl border border-black/[0.06] bg-white"
          style={{ zIndex: layers.length - i, boxShadow: '0 14px 30px -18px rgba(0,0,0,0.3)' }}
          initial={{ y: i * 11, opacity: 1 - i * 0.15 }}
          animate={shouldReduceMotion ? {} : { y: [i * 11, i * 11 - 7, i * 11] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
        />
      ))}
    </div>
  )
}

const DILIGENCE_ITEMS = [
  { label: 'Vendor reviewed', className: 'left-[8%] top-[16%]' },
  { label: 'Risk: Low', className: 'right-[10%] top-[42%]' },
  { label: 'Contract flagged', className: 'left-[14%] bottom-[18%]' },
  { label: 'Security checked', className: 'right-[6%] bottom-[38%]' },
]

function ChecklistChips() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <div className="relative h-full w-full">
      {DILIGENCE_ITEMS.map((item, i) => (
        <motion.div
          key={item.label}
          className={`absolute flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-3 py-1.5 text-[11.5px] font-medium text-black/70 ${item.className}`}
          style={{ boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06), 0 10px 25px -14px rgba(0,0,0,0.3)' }}
          initial={{ opacity: 0, y: 8 }}
          animate={
            shouldReduceMotion
              ? { opacity: 1, y: 0 }
              : { opacity: [0, 1, 1, 0], y: [8, 0, 0, -6] }
          }
          transition={{
            duration: 3.6,
            repeat: shouldReduceMotion ? 0 : Infinity,
            times: [0, 0.18, 0.8, 1],
            delay: i * 0.85,
            ease: 'easeInOut',
          }}
        >
          <CheckCircle size={12} weight="fill" style={{ color: ORANGE }} />
          {item.label}
        </motion.div>
      ))}
    </div>
  )
}

function HandshakeShake() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-4">
      {!shouldReduceMotion &&
        [0, 1].map((delay, i) => (
          <motion.span
            key={i}
            className="absolute left-1/2 top-[42%] h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border"
            style={{ borderColor: 'rgba(248,148,52,0.4)' }}
            initial={{ scale: 0.7, opacity: 0.5 }}
            animate={{ scale: 3.2, opacity: 0 }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut', delay }}
          />
        ))}
      <motion.div
        className="relative flex h-12 w-12 items-center justify-center rounded-full"
        style={{ background: 'rgba(248,148,52,0.12)', color: ORANGE }}
        animate={shouldReduceMotion ? {} : { y: [0, -5, 0, -5, 0], rotate: [0, -6, 4, -6, 0] }}
        transition={{ duration: 1.3, repeat: Infinity, repeatDelay: 1, ease: 'easeInOut' }}
      >
        <Handshake size={22} weight="bold" />
      </motion.div>
      <motion.div
        className="h-1.5 w-8 rounded-full bg-black/10"
        animate={shouldReduceMotion ? {} : { scaleX: [1, 0.7, 1, 0.7, 1], opacity: [0.45, 0.25, 0.45, 0.25, 0.45] }}
        transition={{ duration: 1.3, repeat: Infinity, repeatDelay: 1, ease: 'easeInOut' }}
      />
    </div>
  )
}
```

## Target

Add `useInView` (already part of the `framer-motion` package, just not currently imported) to
each component, and extend each component's existing `shouldReduceMotion` gating to also require
`isInView`. The rule for every component: wherever the code currently checks
`shouldReduceMotion` to decide whether to animate, change that check to
`shouldReduceMotion || !isInView`.

```jsx
// RadarPulse
function RadarPulse() {
  const shouldReduceMotion = useReducedMotion()
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { margin: '100px' })
  const skip = shouldReduceMotion || !isInView

  return (
    <div ref={containerRef} className="relative flex h-full w-full items-center justify-center">
      {!skip &&
        [0, 0.7, 1.4].map((delay, i) => (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border"
            style={{ borderColor: 'rgba(248,148,52,0.4)' }}
            initial={{ scale: 0.6, opacity: 0.6 }}
            animate={{ scale: 3.6, opacity: 0 }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeOut', delay }}
          />
        ))}
      <div
        className="relative flex h-12 w-12 items-center justify-center rounded-full"
        style={{ background: 'rgba(248,148,52,0.12)', color: ORANGE }}
      >
        <Compass size={22} weight="bold" />
      </div>
    </div>
  )
}
```

```jsx
// ConsoleFeed
function ConsoleFeed() {
  const shouldReduceMotion = useReducedMotion()
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { margin: '100px' })
  const [i, setI] = useState(0)

  useEffect(() => {
    if (shouldReduceMotion || !isInView) return
    const id = setInterval(() => setI((v) => (v + 1) % AI_LINES.length), 1900)
    return () => clearInterval(id)
  }, [shouldReduceMotion, isInView])

  return (
    <div ref={containerRef} className="flex h-full w-full flex-col justify-center gap-2 px-6">
      {/* ...unchanged... */}
    </div>
  )
}
```

```jsx
// CodeTyping — add containerRef/isInView, gate `repeat` only (leave `animate` alone; see
// Boundaries for why)
function CodeTyping() {
  const shouldReduceMotion = useReducedMotion()
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { margin: '100px' })

  return (
    <div ref={containerRef} className="flex h-full w-full flex-col justify-center gap-1.5 px-6 font-mono text-[12.5px]">
      {CODE_LINES.map((line, i) => (
        <div key={i} className="overflow-hidden">
          <motion.div
            className={`whitespace-nowrap ${line.className}`}
            style={{ width: `${line.text.length}ch` }}
            initial={shouldReduceMotion ? false : { clipPath: 'inset(0 100% 0 0)' }}
            animate={{ clipPath: 'inset(0 0% 0 0)' }}
            transition={{
              duration: 0.7,
              delay: 0.3 + i * 0.5,
              repeat: shouldReduceMotion || !isInView ? 0 : Infinity,
              repeatDelay: 2.6,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {line.text}
          </motion.div>
        </div>
      ))}
    </div>
  )
}
```

```jsx
// StackLayers
function StackLayers() {
  const shouldReduceMotion = useReducedMotion()
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { margin: '100px' })
  const skip = shouldReduceMotion || !isInView
  const layers = [0, 1, 2]

  return (
    <div ref={containerRef} className="relative flex h-full w-full items-center justify-center">
      {layers.map((i) => (
        <motion.div
          key={i}
          className="absolute h-20 w-32 rounded-xl border border-black/[0.06] bg-white"
          style={{ zIndex: layers.length - i, boxShadow: '0 14px 30px -18px rgba(0,0,0,0.3)' }}
          initial={{ y: i * 11, opacity: 1 - i * 0.15 }}
          animate={skip ? {} : { y: [i * 11, i * 11 - 7, i * 11] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
        />
      ))}
    </div>
  )
}
```

```jsx
// ChecklistChips
function ChecklistChips() {
  const shouldReduceMotion = useReducedMotion()
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { margin: '100px' })
  const skip = shouldReduceMotion || !isInView

  return (
    <div ref={containerRef} className="relative h-full w-full">
      {DILIGENCE_ITEMS.map((item, i) => (
        <motion.div
          key={item.label}
          className={`absolute flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-3 py-1.5 text-[11.5px] font-medium text-black/70 ${item.className}`}
          style={{ boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06), 0 10px 25px -14px rgba(0,0,0,0.3)' }}
          initial={{ opacity: 0, y: 8 }}
          animate={skip ? { opacity: 1, y: 0 } : { opacity: [0, 1, 1, 0], y: [8, 0, 0, -6] }}
          transition={{
            duration: 3.6,
            repeat: skip ? 0 : Infinity,
            times: [0, 0.18, 0.8, 1],
            delay: i * 0.85,
            ease: 'easeInOut',
          }}
        >
          <CheckCircle size={12} weight="fill" style={{ color: ORANGE }} />
          {item.label}
        </motion.div>
      ))}
    </div>
  )
}
```

```jsx
// HandshakeShake
function HandshakeShake() {
  const shouldReduceMotion = useReducedMotion()
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { margin: '100px' })
  const skip = shouldReduceMotion || !isInView

  return (
    <div ref={containerRef} className="relative flex h-full w-full flex-col items-center justify-center gap-4">
      {!skip &&
        [0, 1].map((delay, i) => (
          <motion.span
            key={i}
            className="absolute left-1/2 top-[42%] h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border"
            style={{ borderColor: 'rgba(248,148,52,0.4)' }}
            initial={{ scale: 0.7, opacity: 0.5 }}
            animate={{ scale: 3.2, opacity: 0 }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut', delay }}
          />
        ))}
      <motion.div
        className="relative flex h-12 w-12 items-center justify-center rounded-full"
        style={{ background: 'rgba(248,148,52,0.12)', color: ORANGE }}
        animate={skip ? {} : { y: [0, -5, 0, -5, 0], rotate: [0, -6, 4, -6, 0] }}
        transition={{ duration: 1.3, repeat: Infinity, repeatDelay: 1, ease: 'easeInOut' }}
      >
        <Handshake size={22} weight="bold" />
      </motion.div>
      <motion.div
        className="h-1.5 w-8 rounded-full bg-black/10"
        animate={skip ? {} : { scaleX: [1, 0.7, 1, 0.7, 1], opacity: [0.45, 0.25, 0.45, 0.25, 0.45] }}
        transition={{ duration: 1.3, repeat: Infinity, repeatDelay: 1, ease: 'easeInOut' }}
      />
    </div>
  )
}
```

## Repo conventions to follow

Every one of these six components already branches on `shouldReduceMotion` — this plan reuses
that exact same branching style (`const skip = shouldReduceMotion || !isInView`, then reuse the
existing ternaries/conditionals), rather than introducing a new pattern. `useInView` is exported
from the same `framer-motion` package already imported at the top of the file
(`src/Home.jsx:2-10`) — add it to that existing import list, don't add a new import statement.

## Steps

1. In `src/Home.jsx`, add `useInView` to the existing `framer-motion` import block
   (`src/Home.jsx:2-10`), alongside `useReducedMotion` etc.
2. Replace `RadarPulse` (lines 323-347) with the Target version — adds `containerRef`,
   `isInView`, a `skip` variable, and a `ref={containerRef}` on the root `<div>`.
3. Replace `ConsoleFeed` (lines 351-388) with the Target version — adds `containerRef`,
   `isInView`, `ref={containerRef}` on the root `<div>`, and extends the `setInterval` effect's
   guard condition and dependency array.
4. Replace `CodeTyping` (lines 396-422) with the Target version — adds `containerRef`,
   `isInView`, `ref={containerRef}`, and changes only the `repeat` value in the `transition`
   (leaves `initial`/`animate` untouched — see Boundaries).
5. Replace `StackLayers` (lines 424-442) with the Target version.
6. Replace `ChecklistChips` (lines 451-481) with the Target version.
7. Replace `HandshakeShake` (lines 483-514) with the Target version.

## Boundaries

- Do NOT change any component's visual appearance, timing values (durations, delays, easing), or
  markup structure beyond adding the `ref` and the `isInView`-aware gating shown above.
- For `CodeTyping` specifically: do NOT gate the `initial`/`animate` clip-path values themselves,
  only the `repeat` count. If a card scrolls out of view mid-reveal, the text may be caught
  mid-clip for a moment — this is an accepted, low-stakes cosmetic tradeoff (the AUDIT's own
  `useInView` margin of 100px means this is only visible in a narrow boundary zone at the edge
  of the viewport). Do not add extra logic to freeze/reset the clip-path on exit; that's out of
  scope for this plan.
- Do NOT touch `ServiceCard` or `ServiceCarousel` (the components that render these six) — only
  the six components themselves.
- Do NOT change the `{margin: '100px'}` value without a reason — it gives the animation a small
  head start before the card is fully in view so it doesn't visibly "pop on" right at the
  viewport edge.
- If any of the six components' current code doesn't match what's shown above (drift since
  commit `907098d`), STOP and report instead of improvising — do not guess at a merged version.

## Verification

- **Mechanical**: `npm run lint` — no new errors. `useInView` must resolve as a named export from
  `framer-motion` (it is, in this project's installed version — confirm via
  `grep -r "useInView" node_modules/framer-motion/dist/es/index.mjs` if in doubt).
- **Feel check**: run `npm run dev`, open DevTools → Performance, start a recording, scroll to
  "What We Do", let it sit for ~10 seconds without scrolling, then scroll past it to "How We
  Work" and let that sit for ~10 seconds too, then stop recording.
  - In the recorded trace, confirm there's little-to-no ongoing JS/rAF activity attributable to
    the card animations once the "What We Do" section is fully scrolled past (compare against
    the same recording before this plan, where all 6 loops would show continuous activity the
    entire time).
  - Scroll the carousel itself left/right — confirm each card's animation starts up within a
    couple hundred milliseconds of scrolling it into view (not instantly frozen, not delayed by
    seconds).
  - Confirm all 6 card visuals still look and animate identically to before when they *are* in
    view — this plan must not change their appearance, only when they run.
- **Done when**: scrolling any card in or out of view starts/stops its animation loop
  accordingly, and no card animation runs while fully out of the viewport.
