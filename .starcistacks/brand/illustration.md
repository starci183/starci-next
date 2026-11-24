# starci-next illustration

The concept of the app's AI images (contexts/project/brand.md PROJECT-BRAND-2). The base prompt every image starts with is
`illustration.yaml` (`basePrompt`, version 2); it is not copied here. Change the text, raise the version, make the images again.

## Look

- Flat editorial illustration with soft shading and thin clean dark-grey outlines (v2, 2026-11-24; v1 was 3D clay). Clear and friendly.
- Off-white and light grey shapes on a plain off-white (#FAFAFA) ground; a picture that sits on the page's own ground keeps a transparent one.
- One accent only: the brand violet (`--accent` of `brand.md`, #633AE6), used sparingly.
- Generous empty space, the whole subject inside the frame with a clear margin; no text, no letters, no logos, no UI screenshots, no 3D, no clay.
- **The Next helper** appears in every scene, in a role that fits it: a small violet rounded-square chip with two pins on each side, a simple friendly face (two dot eyes and a small smile) and tiny stubby hands. It is the only face in the picture; people are simple flat figures with plain featureless heads.
- Square 1024 x 1024 for the app states; the art of `statics/art/` keeps the size and ratio of its slot.

## Where an illustration stands

Page-level states only in the app: the first visit, a whole-page empty state, the paywall, the 404 page, the 500 page and the premium-activated moment. The helper may stand on the error screens (owner, 2026-11-24). Never on a working screen,
never inside a list or a form. Rendered at 160 px at 1440 and 120 px at 390. The learning art of `statics/art/` (stages, steps, areas, topics, lessons) carries the same style and helper.

## References

One to three approved images in `references/` show the concept; a `subject` names the reference it follows. A reference is approved by the owner and tracked.
The approved directions live in `statics/brand/direction/`. The helper reference image for the generator is `references/helper-chip.png` (the chip, front view, owner-chosen character B).
A v2 image is generated with a style picture and the helper picture attached.

## Prompt files

An image is generated into `statics/illustrations/<area>/<name>.<ext>` (or `statics/art/...`) with a sibling `<name>.prompt.yaml`: `basePrompt: { version }`, `subject`, `prompt`
(the base text, then the canvas and the subject), `model`, `seed`, `ratio`, `aiGenerated: true`, `approvedBy` and `approvedAt`. The harness check refuses a prompt file made from an old version.
