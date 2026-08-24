# Animation plans

| # | Title | Severity | Status |
| --- | --- | --- | --- |
| [001](001-demo-form-success-transition.md) | Cross-fade the demo form into its success message | MEDIUM | DONE (reconciled — already implemented in `Home.jsx`) |
| [002](002-carousel-rapid-click-guard.md) | Guard the services carousel against rapid-click interruption | HIGH | DONE (executed & approved 2026-08-24) |
| [003](003-carousel-progress-bar-transform.md) | Animate the carousel progress bar with transform, not width | HIGH | DONE (executed & approved 2026-08-24) |
| [004](004-consistent-strong-easing.md) | Replace weak `easeOut` with the site's established strong curve | MEDIUM | DONE (executed & approved 2026-08-24) |
| [005](005-carousel-reduced-motion.md) | Respect reduced motion in the carousel's programmatic scroll | MEDIUM | DONE (executed & approved 2026-08-24) |
| [006](006-agencylogin-teleporting-ui.md) | Add transitions to AgencyLogin's teleporting conditional UI | MEDIUM | DONE (executed & approved 2026-08-24) |
| [007](007-pause-offscreen-card-loops.md) | Pause decorative card-visual loops when off-screen | MEDIUM | DONE (executed & approved 2026-08-24) |
| [008](008-consolidate-easing-token.md) | Consolidate the hand-typed easing curve into one constant | LOW | DONE (executed & approved 2026-08-24) |
| [009](009-agencylogin-sidebar-transition-all.md) | Scope the AgencyLogin sidebar's `transition-all` to real properties | LOW | TODO |
| [010](010-demo-form-error-teleport.md) | Transition the demo form's error message into place | MEDIUM | DONE (executed & approved 2026-08-24) |
| [011](011-footer-scroll-reveal.md) | Give the footer the same scroll-reveal treatment as every other section | LOW | DONE (executed & approved 2026-08-24) |
| [012](012-carousel-arrow-end-state.md) | Give the carousel arrows a disabled state at the ends | LOW | DONE (executed & approved 2026-08-24) |

All plans were written from a full-repo audit on 2026-08-24 at commit `907098d`, covering
`src/Home.jsx` (marketing site) and `src/AgencyLogin.jsx` (internal staff dashboard,
`/agency`). One finding from that audit — an ungated `group-hover:` nudge — was investigated and
**rejected**: Tailwind v4's `hover:`/`group-hover:` variants already compile to
`@media (hover: hover) { &:hover {...} } }` by default (verified by compiling the actual class
with the project's installed Tailwind CLI), so no fix was needed there.

## Execution order

**Done**: 002 → 005 → 003 → 004 → 006 → 007 → 008 → 010 → 011, in that order — each executed in
its own isolated worktree, reviewed against the `review-animations` bar (all nine **Approved**;
007's review noted two honest, non-blocking observations on the accordion's CSS grid-rows
technique — see 006's plan file; 008's executor caught a real wording bug in that plan's own
Verification section — see 008's plan file), then landed in the real files. One landing bug was
caught and fixed during this session: landing 011 initially dropped the `motion.div`'s closing
`>`, breaking the JSX — caught immediately via the IDE's live TS diagnostics and fixed before
moving on; final lint confirmed clean. Net effect:
- `src/Home.jsx`'s `ServiceCarousel`: `isScrollingRef` guard (002) + `shouldReduceMotion` (005)
  both added to `scrollByCard`; the progress bar now animates `scaleX` instead of `width` (003).
- `src/Home.jsx` file-wide: a single `const EASE_OUT = [0.16, 1, 0.3, 1]` constant (008) now
  backs all 13 entrance/exit easing call sites (the original 8 plus the 5 that 004 converted from
  the weak built-in `easeOut`); all six card-visual components now pause via `useInView` when
  scrolled off-screen (007); the demo form's error message now animates in/out via
  `AnimatePresence` (010); the footer now fades/rises into view on scroll like every other
  section (011).
- `src/AgencyLogin.jsx`: the caregiver/client accordion now expands/collapses via a CSS
  grid-rows transition instead of popping instantly, and the login page's error/success banners
  fade in on mount via a new `FadeInBanner` component (006).

**Remaining**:

- **009** (`src/AgencyLogin.jsx` sidebar `transition-all` → scoped properties) — fully
  independent, the only plan left.
- **012** (`src/Home.jsx` carousel arrow disabled state) — reads the carousel's `progress` value;
  no conflict with any landed plan, safe to run any time.

No ordering dependency between 009 and 012 — either can run first, or both in parallel.

**Note for future `execute` runs**: line numbers across both files have drifted from the
`907098d` snapshot every plan was written against (each landed plan added lines). Every plan's
"Boundaries" section already instructs the executor to locate code by its distinguishing content
first and treat cited line numbers as approximate, so this shouldn't cause incorrect edits — just
expect the executor to note the offset when it reports back. When *landing* an executor's diff by
hand (rather than applying it verbatim) — as has been necessary throughout this session, since
each executor works from a fresh worktree at the unmodified `907098d` commit and so never sees
previously-landed plans' changes — re-read the real file's current state immediately after each
Edit, especially for multi-line JSX tag changes, to catch dropped brackets/braces before moving
on.

## Notes

- Plan 001 is reconciled DONE — its original target file (`src/LavaHero.jsx`) no longer exists;
  the fix it described already exists in `src/Home.jsx`'s current `DemoSection`.
- Every plan above was vetted against the live code at commit `907098d` before being written —
  line numbers and code excerpts reflect that commit. If the working tree has since drifted
  further, each plan's own "Boundaries" section instructs the executor to stop and report rather
  than improvise.
