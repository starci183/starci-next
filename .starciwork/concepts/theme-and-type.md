# theme-and-type

The look is the owner's: his HeroUI theme file with exact values, one font for the whole app, and a type scale of two UI sizes.
Colours are a brand decision and an accessibility trade-off is his to make.

## Terms
- **Owner theme**: the HeroUI theme file the owner gave, installed verbatim after `@heroui/styles` in the app's global stylesheet.
- **UI text**: 14 px. **Small names** (meta, badges, counts, timestamps): 12 px. **Display**: the page title 18, big figures 20.
- **Brand font**: IBM Plex Sans 400/500/600, subsets latin and vietnamese, through `next/font/google` as `--font-brand`.

## Rules
1. Theme values are exact: no colour is swapped for another or for a different token, even for contrast; a concern is raised as a
   question to the owner.
2. One font everywhere, lesson markdown included.
3. No 13 and no 16 for UI text (the owner measured 16 px labels live and rejected them); hierarchy comes from weight and the muted tone,
   never from a bigger size.
4. Dark mode is never drawn or hand-picked: it resolves only from theme tokens, with no literal dark value or hex colour in app code.
5. Inline links use the exact primary colour. A standalone secondary or navigation link (back, cancel, "Xem Premium", aside and
   resource links, legal footer) is the foreground colour, never the accent.
6. An informative Alert or Toast never sits on a pink or purple ground.
7. There is no second brand palette (the old Academy `#7547ff` is gone).

## Example
A section title is 14 px at weight 500–600 in the foreground; its count is a 12 px muted chip; no title is enlarged to look important.

## Don't / Instead
- Don't fix low contrast by choosing another colour; ask the owner.
- Don't write `dark:` values by hand; use the theme tokens.

## Where
`fe/apps/app/src/app/`, `fe/apps/app/src/modules/brand/`, `fe/apps/app/src/features/layouts/`

Related: [surface-layering](surface-layering.md), [app-shell](app-shell.md)
