# Animation plans

| # | Title | Severity | Status |
| --- | --- | --- | --- |
| [001](001-demo-form-success-transition.md) | Cross-fade the demo form into its success message | MEDIUM | TODO |

## Execution order

Single plan, no dependencies — safe to execute standalone with
`improve-animations execute 001-demo-form-success-transition.md`.

## Notes

Plan 001 was written on demand from a specific finding (`find-animation-opportunities` output),
not from a full repo audit. No other findings have been vetted yet — running `improve-animations`
bare (or `improve-animations deep`) would audit the rest of `LavaHero.jsx` and `AgencyLogin.jsx`
and likely add more entries here.
