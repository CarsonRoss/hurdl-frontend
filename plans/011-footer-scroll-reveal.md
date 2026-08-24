# 011 — Give the footer the same scroll-reveal treatment as every other section

- **Status**: DONE (executed & approved 2026-08-24)
- **Commit**: 907098d
- **Severity**: LOW
- **Category**: Missed opportunity (cohesion)
- **Estimated scope**: 1 file (`src/Home.jsx`), `Footer`

## Problem

Every other section on the page — Hero (on load), About, Services (heading + cards),
HowWeWork (heading + steps), DemoSection (form) — fades/rises into place via `whileInView`.
`Footer` is the one section with zero motion: it's just a static `<footer>`, no `motion.div`,
no `whileInView` anywhere. This is a minor, low-stakes inconsistency (footers are conventionally
often left static — leaving it alone is a defensible choice), but if closed it should follow the
exact pattern the rest of the page already uses.

Current code, `src/Home.jsx:818-846`:

```jsx
function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative overflow-hidden border-t border-black/[0.06] bg-white">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-14 text-sm text-black/55 sm:grid-cols-4 sm:px-8">
        <div className="col-span-2 sm:col-span-1">
          <img src="/hurdl_logo.png" alt="Hurdl" className="h-7 w-auto" />
          <p className="mt-3 leading-6">Technical expertise, on demand.</p>
        </div>
        <div>
          <p className="mb-3 text-xs uppercase tracking-[0.14em] text-black/35">Information</p>
          <a href="/privacy" className="block transition-colors hover:text-black">
            Privacy Policy
          </a>
          <a href="/terms" className="mt-2 block transition-colors hover:text-black">
            Terms &amp; Conditions
          </a>
        </div>
        <div className="sm:text-right">
          <p>&copy; {currentYear} Hurdl</p>
        </div>
      </div>
      <p className="pointer-events-none -mt-4 select-none text-center text-[22vw] font-black leading-[0.7] tracking-tight text-black/[0.03] sm:text-[16vw]">
        Hurdl
      </p>
    </footer>
  )
}
```

## Target

Wrap the footer's content grid in a `motion.div` with the same `whileInView` fade/rise every
other section uses. The giant watermark "Hurdl" text stays static (it's decorative background
texture, not content — animating it would be a distraction, not a fix):

```jsx
function Footer() {
  const currentYear = new Date().getFullYear()
  const shouldReduceMotion = useReducedMotion()

  return (
    <footer className="relative overflow-hidden border-t border-black/[0.06] bg-white">
      <motion.div
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
        whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-10% 0px' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-14 text-sm text-black/55 sm:grid-cols-4 sm:px-8"
      >
        <div className="col-span-2 sm:col-span-1">
          <img src="/hurdl_logo.png" alt="Hurdl" className="h-7 w-auto" />
          <p className="mt-3 leading-6">Technical expertise, on demand.</p>
        </div>
        <div>
          <p className="mb-3 text-xs uppercase tracking-[0.14em] text-black/35">Information</p>
          <a href="/privacy" className="block transition-colors hover:text-black">
            Privacy Policy
          </a>
          <a href="/terms" className="mt-2 block transition-colors hover:text-black">
            Terms &amp; Conditions
          </a>
        </div>
        <div className="sm:text-right">
          <p>&copy; {currentYear} Hurdl</p>
        </div>
      </motion.div>
      <p className="pointer-events-none -mt-4 select-none text-center text-[22vw] font-black leading-[0.7] tracking-tight text-black/[0.03] sm:text-[16vw]">
        Hurdl
      </p>
    </footer>
  )
}
```

If plan 008 (easing token consolidation) has already run, use `EASE_OUT` instead of the literal
`[0.16, 1, 0.3, 1]` array.

## Repo conventions to follow

This is the exact pattern `About`'s heading block already uses — same duration, same curve, same
viewport margin:

```jsx
// src/Home.jsx:286-290 — existing exemplar
<motion.div
  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
  whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
  viewport={{ once: true, margin: '-15% 0px' }}
  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
>
```

This plan uses a slightly smaller `y: 16` / `duration: 0.6` / `margin: '-10% 0px'` — appropriate
for a footer, which is short and typically already at/near the bottom of the viewport when it
starts entering (a smaller rise distance and tighter trigger margin reads better here than
copying the larger hero-section values verbatim).

## Steps

1. In `src/Home.jsx`, inside `Footer` (starts at line 818), add
   `const shouldReduceMotion = useReducedMotion()` after `const currentYear = ...`.
2. Change the content `<div className="mx-auto grid ...">` to a `<motion.div>` with the props
   shown in Target, keeping its existing className unchanged.
3. Leave the giant watermark `<p>Hurdl</p>` (lines 841-843) and everything else untouched.

## Boundaries

- Do NOT animate the giant background "Hurdl" watermark text — it's decorative texture, leave it
  static.
- Do NOT change the footer's layout, copy, or links.
- `useReducedMotion` is already imported from `framer-motion` at the top of the file — no new
  import needed.
- If the current code at `src/Home.jsx:818-846` doesn't match what's shown above (drift since
  commit `907098d`), STOP and report instead of improvising.

## Verification

- **Mechanical**: `npm run lint` — no new errors.
- **Feel check**: run `npm run dev`, scroll all the way to the bottom of the page slowly —
  confirm the footer content fades and rises into place as it enters the viewport, consistent
  with how every section above it already behaves. Reload and scroll fast past it — confirm it
  still ends up fully visible (no animation getting stuck mid-way due to `viewport={{ once: true
  }}` combined with a fast scroll — this is standard framer-motion `whileInView` behavior already
  used correctly elsewhere in the file, so it should just work).
- **Done when**: the footer's content fades/rises into view on scroll, matching the rest of the
  page, and the watermark text is unaffected.
