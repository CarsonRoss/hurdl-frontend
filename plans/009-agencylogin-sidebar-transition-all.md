# 009 — Scope the AgencyLogin sidebar's `transition-all` to real properties

- **Status**: TODO
- **Commit**: 907098d
- **Severity**: LOW
- **Category**: Performance
- **Estimated scope**: 1 file (`src/AgencyLogin.jsx`), 1 className

## Problem

The staff-dashboard sidebar uses Tailwind's `transition-all` to animate both its horizontal
position (mobile slide-in/out) and its width (desktop collapse/expand), driven by the same
conditional class list. `transition-all` animates every animatable CSS property that changes,
not just the two actually intended — a general "always a finding" per Category 5. This is a
low-frequency internal-tool interaction (staff toggling their own nav), so the real-world
performance impact is small, but the fix is cheap and mechanical.

Current code, `src/AgencyLogin.jsx:300-303`:

```jsx
<aside
  className={`fixed inset-y-0 left-0 z-50 flex w-56 shrink-0 flex-col border-r border-[#ececec] bg-white overflow-hidden transition-all duration-200 md:static md:z-auto md:translate-x-0 ${
    sidebarOpen ? 'translate-x-0 md:w-56' : '-translate-x-full md:w-14'
  }`}
>
```

The sidebar genuinely changes two different kinds of property depending on breakpoint: on
mobile, `translate-x` slides it fully off/on screen; on desktop (`md:`), its `width` collapses
between `14` and `56`. Both are driven by the same `sidebarOpen` boolean.

## Target

Replace `transition-all` with an explicit property list covering exactly the two properties that
actually change:

```jsx
<aside
  className={`fixed inset-y-0 left-0 z-50 flex w-56 shrink-0 flex-col border-r border-[#ececec] bg-white overflow-hidden transition-[transform,width] duration-200 md:static md:z-auto md:translate-x-0 ${
    sidebarOpen ? 'translate-x-0 md:w-56' : '-translate-x-full md:w-14'
  }`}
>
```

## Repo conventions to follow

This file already scopes its other transitions to specific properties rather than using bare
`transition-all` anywhere else — e.g. `transition-colors` (multiple places) and
`transition-transform` on the accordion chevron (`src/AgencyLogin.jsx:371`). This plan brings the
sidebar in line with that existing convention, using Tailwind's arbitrary-property transition
syntax (`transition-[prop1,prop2]`) since two distinct properties need to be covered.

## Steps

1. In `src/AgencyLogin.jsx`, locate the `<aside>` element's `className` (line 301).
2. Replace `transition-all duration-200` with `transition-[transform,width] duration-200`.
3. Leave every other class and the conditional `sidebarOpen ? ... : ...` expression unchanged.

## Boundaries

- Do NOT change the actual open/collapsed widths (`w-56`/`w-14`) or the mobile slide values
  (`translate-x-0`/`-translate-x-full`).
- Do NOT add a duration change — `duration-200` stays as-is; this plan is a property-scope fix
  only, not a timing change.
- Do NOT touch the mobile overlay backdrop (`src/AgencyLogin.jsx:296-298`) or the hamburger
  button — only the `<aside>` className.
- If the current code at `src/AgencyLogin.jsx:300-303` doesn't match what's shown above (drift
  since commit `907098d`), STOP and report instead of improvising.

## Verification

- **Mechanical**: `npm run lint` — no new errors.
- **Feel check**: run `npm run dev`, navigate to `/agency` at a mobile viewport width (< 768px),
  click the hamburger button to open the sidebar, confirm it still slides in from the left
  smoothly; click the collapse toggle inside the sidebar at a desktop viewport width, confirm the
  width still animates smoothly between collapsed and expanded. Both should look and feel
  identical to before this change — only the underlying CSS property list has narrowed.
  - In DevTools' Elements panel, inspect the `<aside>` element's computed `transition-property`
    value — confirm it now reads `transform, width` instead of `all`.
- **Done when**: the sidebar's `transition-property` is scoped to `transform, width`, and both
  the mobile slide and desktop collapse still animate correctly.
