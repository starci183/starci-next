# surface-layering

White, flat chrome around one pink well that holds separate floating white cards, one card per job (owner: "tách ra nhiều khối nổi").
Plus the button, icon and link laws every page follows.

## Terms
- **Chrome**: sidebar, top bar, page header band and the right aside pane; white (`--surface`), flat, separated by borders only.
- **Well**: the middle area on the pink `--background`, content capped at 80rem (`--grammar-content-max`) and centred.
- **Card**: a Grammar SurfaceCard floating in the well (shadow, no border), 12–16 px from the next.
- **Aside pane**: sections and rows with dividers; below `lg` its blocks become the first blocks of the well.

## Rules
1. One card holds one content (a list, a form, a table or figures); never a card inside a card, never blocks merged into one big
   card. A lone sentence is a row of a list card, never its own card.
2. Block labels sit on the well above their card; group sublabels are 12 px, weight 500, muted.
3. The aside is never made of floating cards.
4. The header band is flush left, never centred over narrow content.
5. Only a primary CTA (size md or lg) carries a leading icon; size sm never has an icon; neutral buttons, suggestion pills and row
   actions are text only.
6. Icons are outline only; an icon standing alone sits in an icon tile, an inline icon is plain.
7. Links are underlined on hover only; an inline link ends with an arrow; a navigation link in a section head ends with "→"; sidebar
   items carry no arrow.
8. Empty, loading and error states live inside their card; an error offers a neutral "Thử lại".

## Example
The Dự án page: a white band with the title; in the well, the label "Dự án của bạn" with a grey count chip above one list card (tabs
and search in its toolbar zone, rows below); a white aside "Máy của bạn".

## Don't / Instead
- Don't put filters straight on the pink well; put them in the card's toolbar zone.
- Don't add an icon to a neutral or small button; keep it text only.

## Where
`fe/apps/app/src/components/blocks/`, `fe/packages/starci-next-ui/`

Related: [theme-and-type](theme-and-type.md), [app-shell](app-shell.md), [gallery](gallery.md)
