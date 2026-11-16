# gallery

Every screen has a gallery folder of shots and an `explain.md` that traces each region to a law and a Grammar part, and a coded screen
is compared with its approved drawing before anyone calls it done (owner: a screen is not done from tsc alone).

## Terms
- **Screen folder**: `gallery/pages/<area>/<screen>/` with `1440.png`, `1920.png`, `390.png`, the required `explain.md` and an
  optional `links.json`.
- **Flow**: a named sequence of screens in `gallery/flows.json`.
- **Explain**: for every visible region, what it is, why it is drawn so (which owner law or concept) and its Grammar reference
  (component, prop, source or story).

## Rules
1. A region that cannot be explained by a law and a Grammar reference is a bug, fixed before reporting.
2. After a screen is coded it is shot at the three widths, full page, and compared with the approved drawing (layout, gaps, alignment,
   type sizes, component choice); the differences are fixed before the owner is told it is done.
3. The gallery holds the current screen only: no `before/` folder, no variant file names; showcase shots are after-fix shots of
   finished pages.
4. The gallery is the app's own Vite gallery, never a temporary folder or a hand-made page.

## Example
`gallery/pages/projects/list/` holds the three shots and an `explain.md` whose region "Ô tìm kiếm" cites the card-zones law and names
the SurfaceCard header with a search zone.

## Don't / Instead
- Don't report a UI as done with no shot and comparison; shoot, compare, fix, then report.
- Don't keep old shots beside new ones; replace them.

## Where
`gallery/pages/`, `gallery/src/`, `scripts/`

Related: [surface-layering](surface-layering.md), [theme-and-type](theme-and-type.md), [app-shell](app-shell.md)
