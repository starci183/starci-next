# theme-and-type

The look is the white theme the owner ruled on 2026-11-17 with StarCi Next's own violet accent: a white page, neutrals with no hue, one font for the whole app and a type scale of two UI sizes. Colours are a brand decision and an accessibility trade-off is his to make.

## Terms
- **Brand file**: `fe/apps/app/src/modules/brand/brand.css` (the landing imports this same file from its globals.css): the one place the app writes colour, loaded after `@heroui/styles` and the Grammar's common stylesheet. It also sets the Grammar theme hooks (`--starci-core-*`).
- **Accent**: the violet `--accent`. A signal only: the one primary button, the urgent count, the focus edge and ring, the checked checkbox, radio and switch. Errors use `--danger`.
- **UI text**: 14 px. **Small names** (meta, badges, counts, timestamps): 12 px. **Display**: the page title 18, big figures 20.
- **Brand font**: IBM Plex Sans 400/500/600, subsets latin and vietnamese, through `next/font/google` as `--font-brand`.

## Rules
1. The page and every surface are white (`oklch(100% 0 0)`); every neutral has chroma 0. Layers separate by a 1px hairline (`--border`, `--separator`), never by a tinted fill; a shadow only on a real floating layer (popover, menu, dialog, toast).
2. A selected nav item or selectable list row is the accent-soft background (`--accent-soft`, text and icon `--accent-soft-foreground`), rounded like the item, with no one-sided accent bar (owner 2026-11-24); hover is the neutral `--default` background. A selected chip or table row stays gray; a tab underline is the foreground colour.
3. A field has one look: white with a 1px border; focus is the accent border with a 3px soft ring. Buttons are pills; a Switch is `kind="compact"` in a settings or list row and `kind="toggle"` standing alone.
4. Info is a neutral gray; a status badge is a soft pair (the colour's soft background with its soft foreground).
5. One font everywhere, lesson markdown included.
6. No 13 and no 16 for UI text (the owner measured 16 px labels live and rejected them); hierarchy comes from weight and the muted tone, never from a bigger size.
7. Dark mode is never drawn or hand-picked: it resolves only from theme tokens, with no literal dark value or hex colour in app code.
8. Inline links use the text-safe accent (`--link`). A standalone secondary or navigation link (back, cancel, "Xem Premium", aside and resource links, legal footer) is `variant="plain"`, never the accent.
9. An informative Alert or Toast is neutral gray, never on an accent ground.
10. There is no second brand palette (the old Academy `#7547ff` is gone).

## Example
A section title is 14 px at weight 500–600 in the foreground; its count is a 12 px muted chip; no title is enlarged to look important.

## Don't / Instead
- Don't fix low contrast by choosing another colour; ask the owner.
- Don't write `dark:` values by hand; use the theme tokens.
- Don't restyle a Grammar part in the app; set a token or a theme hook in the brand file.

## Where
`fe/apps/app/src/app/`, `fe/apps/app/src/modules/brand/`, `fe/apps/app/src/features/layouts/`

Related: [surface-layering](surface-layering.md), [app-shell](app-shell.md)
