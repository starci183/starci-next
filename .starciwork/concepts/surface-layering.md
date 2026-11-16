# surface-layering

A white page with flat content: tables, lists, forms and details sit directly on the surface under a section head, and a card exists only for a real object (owner 2026-11-17: "chỉ thẻ cho vật thật"). Plus the button, icon and link laws every page follows.

## Terms
- **Chrome**: sidebar, top bar, page header band and the right aside pane; white (`--surface`), flat, separated by borders only.
- **Surface**: the page area under the chrome, white (`--background`), content capped at 80rem (`--grammar-content-max`) and centred.
- **Section**: a Grammar `Section` (a head with a title, count and one action, then its body); a list, a table, a form or a set of details is its body, never a card.
- **Card**: a Grammar SurfaceCard with a hairline edge and no shadow, for a real object you can pick up: a tool tile, a deck, a plan summary, a question or review item, a sign-in or result panel.
- **Ribbon**: `Section kind="figures" ribbon`, the figures strip as a full-width band with a hairline on top and bottom only.
- **Aside pane**: sections and rows with dividers; below `lg` its blocks become the first blocks of the page.

## Rules
1. A list, a table (`DataTable`, flat by default), a form or a details list (`DescriptionList isDivided`) is a Section on the surface; never a card around it, never a card inside a card.
2. A card holds one object. A lone sentence is a row of a list, never its own card.
3. Block labels are Section heads on the surface; group sublabels are 12 px, weight 500, muted.
4. The aside is never made of cards.
5. The header band is flush left, never centred over narrow content; its title is 18/600 and its description 12 muted.
6. Only a primary CTA (size md or lg) carries a leading icon; size sm never has an icon; neutral buttons, suggestion pills and row actions are text only. A screen has one primary button: when several commands compete (a resume, a plan link, a start), only the first in priority is primary and the rest are neutral. A command repeated per row (add a deck) is a neutral small button.
7. Icons are outline only; an icon standing alone sits in an icon tile, an inline icon is plain. A bullet that is a check mark is a check, never an empty ring (it reads as an unselected radio).
8. Links are underlined on hover only; an inline link ends with an arrow; a navigation link in a section head ends with "→"; sidebar items carry no arrow.
9. Empty, loading and error states live inside their section or card; an error offers a neutral "Thử lại".

## Example
The Dự án page: a white band with the title; on the surface, the section "Dự án của bạn" with a grey count chip, a filter row (tabs and search) and the rows below it, separated by hairlines; a white aside "Máy của bạn".

## Don't / Instead
- Don't wrap a list or a form in a card; give it a Section head.
- Don't add an icon to a neutral or small button; keep it text only.
- Don't repeat a primary button down a list; use a neutral small button.

## Where
`fe/apps/app/src/components/blocks/`, `fe/packages/starci-next-ui/`

Related: [theme-and-type](theme-and-type.md), [app-shell](app-shell.md), [gallery](gallery.md)
