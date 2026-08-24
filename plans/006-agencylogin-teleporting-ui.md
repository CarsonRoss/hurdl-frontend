# 006 — Add transitions to AgencyLogin's teleporting conditional UI

- **Status**: DONE (executed & approved 2026-08-24)
- **Commit**: 907098d
- **Severity**: MEDIUM
- **Category**: Missed opportunity (Purpose: preventing a jarring change)
- **Estimated scope**: 1 file (`src/AgencyLogin.jsx`), two independent locations

## Problem

`src/AgencyLogin.jsx` uses no motion library at all (confirmed: zero `framer-motion` imports,
zero `@keyframes` — only Tailwind's default `transition-colors`/`transition-transform`
utilities). Two pieces of conditionally-rendered UI mount/unmount with zero transition, teleporting
in and out:

**1. The caregiver/client accordion body** — staff expand this routinely to review or edit
restrictions; it currently pops open/closed instantly:

```jsx
// src/AgencyLogin.jsx:377-432 — current
{isExpanded && (
  <div className="space-y-4 border-t border-[#ececec] px-5 py-4">
    <div className="space-y-2">
      {(person.restrictions || []).map((entry) => (
        <div
          key={entry.name}
          className="flex items-start justify-between gap-3 rounded-lg bg-[#f7f7f7] px-3 py-2.5"
        >
          <div>
            <p className="text-sm">{restrictionLabel(entry.name, restrictionTypes)}</p>
            {entry.notes ? <p className="mt-0.5 text-xs text-[#888]">{entry.notes}</p> : null}
          </div>
          <button
            type="button"
            onClick={() => removeRestriction(entry.name)}
            className="shrink-0 text-xs text-[#b13d18] hover:underline"
          >
            Remove
          </button>
        </div>
      ))}
      {(person.restrictions || []).length === 0 ? (
        <p className="text-xs text-[#999]">No restrictions yet.</p>
      ) : null}
    </div>

    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <select
        className="flex-1 rounded-lg border border-[#dfdfdf] bg-white px-3 py-2 text-sm"
        value={newRestrictionName}
        onChange={(e) => setNewRestrictionName(e.target.value)}
      >
        <option value="">Add a restriction...</option>
        {availableRestrictions.map((type) => (
          <option key={type.id} value={type.name}>
            {restrictionLabel(type.name, restrictionTypes)}
          </option>
        ))}
      </select>
      <input
        className="rounded-lg border border-[#dfdfdf] bg-white px-3 py-2 text-sm sm:flex-1"
        placeholder="Notes (optional)"
        value={restrictionNotes}
        onChange={(e) => setRestrictionNotes(e.target.value)}
      />
      <button
        type="button"
        onClick={addRestriction}
        disabled={!newRestrictionName}
        className="rounded-lg bg-[#F89434] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#E0841E] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Add
      </button>
    </div>
  </div>
)}
```

**2. The login page's error/success banners** — a user's very first feedback from this app:

```jsx
// src/AgencyLogin.jsx:453-460 — current
<div className="mb-6">
  {error ? (
    <p className="rounded-lg border border-[#f5c6cb] bg-[#fdecea] px-4 py-3 text-[0.85rem] text-[#c0392b]">{error}</p>
  ) : null}
  {success ? (
    <p className="rounded-lg border border-[#b7e1a1] bg-[#eafbe7] px-4 py-3 text-[0.85rem] text-[#1a7f37]">{success}</p>
  ) : null}
</div>
```

## Target

**1. Accordion — CSS grid-rows trick** (animates both open and close, no JS height
measurement, no new dependency):

```jsx
<div
  className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
    isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
  }`}
>
  <div className="overflow-hidden">
    <div className="space-y-4 border-t border-[#ececec] px-5 py-4">
      {/* ...everything that was previously inside the `{isExpanded && (...)}` block,
           unchanged... */}
    </div>
  </div>
</div>
```

The outer `<div>` is now always rendered (not conditional) — only its `grid-template-rows` value
depends on `isExpanded`. The middle `<div className="overflow-hidden">` clips the content while
the row is collapsed to `0fr`.

**2. Login banners — fade + rise on mount**, using the `data-mounted` pattern (Category 4's
documented JS fallback for entry transitions, since these mount conditionally and there's no
"before" DOM state a plain CSS transition can start from):

```jsx
function FadeInBanner({ children, className }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return (
    <p
      className={`${className} transition-[opacity,transform] duration-200 ease-out ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'
      }`}
    >
      {children}
    </p>
  )
}
```

```jsx
<div className="mb-6">
  {error ? (
    <FadeInBanner className="rounded-lg border border-[#f5c6cb] bg-[#fdecea] px-4 py-3 text-[0.85rem] text-[#c0392b]">
      {error}
    </FadeInBanner>
  ) : null}
  {success ? (
    <FadeInBanner className="rounded-lg border border-[#b7e1a1] bg-[#eafbe7] px-4 py-3 text-[0.85rem] text-[#1a7f37]">
      {success}
    </FadeInBanner>
  ) : null}
</div>
```

## Repo conventions to follow

This file has no motion library and no shared token file — stay CSS-only and match its existing
inline-utility style (no separate stylesheet, no new `.css` file). The accordion's existing
chevron rotation is the closest thing to a precedent already in this file:

```jsx
// src/AgencyLogin.jsx:371 — existing exemplar for property-scoped transitions
className={`h-4 w-4 text-[#999] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
```

Follow that same pattern: scope the `transition-*` utility to the exact property being animated
(`grid-template-rows`, `opacity`/`transform`) rather than a bare `transition` or `transition-all`.

## Steps

1. In `src/AgencyLogin.jsx`, near the top of the file (after the existing imports, before the
   main component), add the `FadeInBanner` function component shown in Target.
2. Replace the `<div className="mb-6">...</div>` block (current lines 453-460) with the Target
   version using `FadeInBanner`.
3. Replace `{isExpanded && (<div className="space-y-4 border-t ...">...</div>)}` (current lines
   377-432) with the Target grid-rows wrapper — the inner content (restriction list, add-form)
   moves inside the new nested `<div>`s unchanged, only the two wrapping `<div>`s are new.
4. Confirm `useState` and `useEffect` are already imported at the top of the file (they are, per
   existing code) — no new imports needed for either change.

## Boundaries

- Do NOT add `framer-motion` or any other new dependency to this file — it stays CSS-only,
  consistent with the rest of the file.
- Do NOT animate individual restriction-chip add/remove (the `.map()` at line 380) — giving each
  chip its own enter/exit animation requires keeping removed items mounted during their exit,
  which is a larger structural change than this plan covers. Leave that `.map()` as-is.
- Do NOT touch the exit transition for the login banners (`FadeInBanner` only handles the
  entrance) — when `error`/`success` becomes falsy the `<p>` unmounts instantly, same as today.
  That's an accepted scope limit for this plan, not a bug to fix here.
- Do NOT change any restriction/login business logic (`togglePerson`, `addRestriction`,
  `removeRestriction`, `handleSubmit`, etc.) — motion/markup only.
- If the current code at either location doesn't match what's shown above (drift since commit
  `907098d`), STOP and report instead of improvising.

## Verification

- **Mechanical**: `npm run lint` — no new errors.
- **Feel check**: run `npm run dev`, navigate to `/agency`.
  - Log in (or navigate directly if already authenticated in this session), click a
    caregiver/client row to expand it — the panel should grow open smoothly, not pop instantly.
    Click again to collapse — it should shrink smoothly, not disappear instantly.
  - On the login screen, submit with an invalid phone/password to trigger the error banner —
    confirm it fades and rises into place rather than popping in.
  - In DevTools' Animations panel, set playback to 20% and confirm the accordion's
    `grid-template-rows` interpolates smoothly in both directions, and the banner's opacity/
    transform ease in together.
  - Toggle `prefers-reduced-motion: reduce` in DevTools' Rendering panel — confirm both still
    provide *some* feedback (opacity change is fine to keep per Category 6; if you want to gate
    the accordion's duration down further under reduced motion, that's acceptable but not
    required for this plan).
- **Done when**: the accordion opens/closes smoothly in both directions, and both login banners
  fade in on mount, with no change to any business logic.
