# starci-next illustration

The concept of the app's AI images (contexts/project/brand.md PROJECT-BRAND-2). The base prompt every image starts with is
`illustration.yaml` (`basePrompt`, version 3); it is not copied here. Change the text, raise the version, make the images again.

## Look

- Flat editorial illustration with soft shading and thin clean dark-grey outlines (v2, 2026-11-24; v1 was 3D clay). Clear and friendly.
- Off-white and light grey shapes on a plain off-white (#FAFAFA) ground; a picture that sits on the page's own ground keeps a transparent one.
- One accent only: the brand violet (`--accent` of `brand.md`, #633AE6), used sparingly.
- Generous empty space, the whole subject inside the frame with a clear margin; no text, no letters, no logos, no UI screenshots, no 3D, no clay.
- **The Next helper is optional** (v3, 2026-11-24, owner: "nhiều hình không cần linh vật nhé"). A picture is a plain scene by default; the helper (a small violet rounded-square chip with two pins on each side, a simple friendly face of two dot eyes and a small smile, tiny stubby hands) appears only when the subject asks for it, for instance a page-level state such as the first visit or an error screen. When it appears it is the only face in the picture; people are simple flat figures with plain featureless heads.
- **One literal scene.** Each picture shows ONE literal, concrete scene that means exactly one thing: what the reader would actually see (a product page with many cursors clicking it at the same moment for "traffic spike"; a cache box and a DB box with one arrow for "cache miss"). No metaphors, no symbolic objects, no mascot unless asked, no text; one idea per picture. The subject line describes the visible objects and the single action.
- Square 1024 x 1024 for the app states; the art of `statics/art/` keeps the size and ratio of its slot.

## Where an illustration stands

Page-level states only in the app: the first visit, a whole-page empty state, the paywall, the 404 page, the 500 page and the premium-activated moment. The helper may stand on the error screens when their subject asks for it (owner, 2026-11-24). Never on a working screen,
never inside a list or a form. Rendered at 160 px at 1440 and 120 px at 390. The learning art of `statics/art/` (stages, steps, areas, topics, lessons) carries the same style; the helper only where its subject asks for it.

## Explainer

A lesson's explainer is the one exception to "no text, one literal scene": a picture a learner reads at a glance to see how the concept
works, like a hand-drawn system diagram poster (owner, 2026-11-27). Its base prompt is `media.yaml` (`bases.explainer`, version 1), kept
apart from the illustration base prompt; it is not copied here.

- Same flat look and ground as the illustrations; violet for the main flow, numbered steps, keys and helpers; green only for the success
  path, red only for a failure; dark grey for every word.
- Fixed measurements on the 1672 x 941 canvas, the same in every explainer (owner 2026-11-27, "1 size"): title 64 px serif on a 96 px tag,
  description 28 px serif on a 52 px tag, actor tags 52 px, step tags 44 px, step circles 48 px, helpers 128 px, arrows 6 px; the
  numbers live in `media.yaml`.
- Exactly two typefaces, as in the app: IBM Plex Serif for the title and the description line, IBM Plex Sans for every label, step text
  and checklist line. Words in Vietnamese with correct diacritics, written exactly as the prompt gives them.
- Fixed parts: a title (the concept's name, e.g. "Idempotency key", never a story sentence), a one-line description, the actors left to
  right with label tags, numbered steps 1, 2, 3 ... on the arrows, and a pinned checklist card bottom-right (two to four lines).
- The Next helper stands for each service that acts; nothing else has a face.
- 1672 x 941, generated with the style picture `statics/art/v2/lesson-outbox-idempotency.webp` attached. Stored at
  `statics/art/explainers/<concept>.webp` with a sibling `<concept>.prompt.yaml` whose `basePrompt: { name: explainer, version }` names this base.

## References

One to three approved images in `references/` show the concept; a `subject` names the reference it follows. A reference is approved by the owner and tracked.
The approved directions live in `statics/brand/direction/`. The helper reference image for the generator is `references/helper-chip.png` (the chip, front view, owner-chosen character B).
A v3 image is generated with the style picture attached, and the helper picture only when its subject asks for the helper. Images made with v2 keep their prompt files until they are redrawn.

## Prompt files

An image is generated into `statics/illustrations/<area>/<name>.<ext>` (or `statics/art/...`) with a sibling `<name>.prompt.yaml`: `basePrompt: { version }`, `subject`, `prompt`
(the base text, then the canvas and the subject), `model`, `seed`, `ratio`, `aiGenerated: true`, `approvedBy` and `approvedAt`. The harness check refuses a prompt file made from an old version.
