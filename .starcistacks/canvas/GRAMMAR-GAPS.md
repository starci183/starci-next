# StarCi Next canvas: Grammar gaps

Checked on 2026-11-17 against `D:/.claude/packages/grammar/src` (core/leaf, branch, composite, frame). The five lanes listed 24 "cần Grammar" items. 13 of them are already covered by an existing element or slot, and the concept notes have been corrected. 10 real gaps remain, plus one that is app-owned rather than a Grammar gap.

## Real gaps (draw now, build in Grammar later)

| # | Gap | Page (gallery id) | Why the current Grammar is not enough | Proposed shape |
|---|-----|-------------------|----------------------------------------|----------------|
| 1 | **QrCode** | commerce/premium | There is no QR element (searched `core/**` for qr). | A leaf `QrCode` with `value`, `label`, `size`, `isLoading`, and an expired state. The bank fields next to it use `CopyField`. |
| 2 | **Meter "in progress" segment** | essentials/catalog, essentials/topic | `Meter segments={4}` fills the done parts, but it has no level for a part that is under way. | A `current` index or `partial` count on a segmented Meter, so that one segment can be drawn at half strength. |
| 3 | **Graded choice** | essentials/lesson (Bản chất) | `RadioGroup` has no state after grading: correct/wrong per option plus an explanation slot. `ListRow verdict` gives the tick but not the radio semantics. | `RadioGroup` takes `verdicts: Record<value, "success" \| "danger">` and `explanation` (ReactNode), and becomes read-only after grading. |
| 4 | **ToolCallLine** | essentials/lesson-scenarios | `MessageBubble`/`MessageCard` show text messages, not "the agent called tool X with Y". | A compact row inside a chat thread: tool name, short args, status (running, ok, error), expandable output. |
| 5 | **MermaidDiagram vertical at narrow width** | essentials/lesson-source | `frame/MermaidDiagram` renders the author's direction (no `orientation` prop). | A `narrowDirection="TB"` prop that switches LR to TB under a container width. |
| 6 | **Inline edit row** | projects/milestone | `ListRow` has `detail` and `action` slots, but no edit mode that swaps the row for a form with Save/Cancel. | `ListRow` `isEditing` + `editor` slot, which keeps the row's position and announces the mode. |
| 7 | **TableOfContents** (scroll-spy) | harness/doc, harness/guide | `MarkdownArticle` has no in-article outline, and nothing tracks the heading being read. | A frame part `TableOfContents` built from article headings, with the current heading marked gray (selection) and a sticky position. |
| 8 | **Code editor** | practice/problem | `Textarea` is plain. `Markdown` has a highlight slot, but only for read-only fenced blocks. | A `CodeEditor` branch: line numbers, monospaced font, tab indent, highlighter slot (the app brings the highlighter, as with Markdown), `isReadOnly`. |
| 9 | **GradeButtons** | review/session | `ButtonGroup` + `Kbd` exist, but a button cannot carry a sublabel (the next interval, for example "4 ngày") under its text. | `ButtonGroup` items take `sublabel` and `shortcut`. One item can be `intent="commit"`. |
| 10 | **Avatar upload ring** | profile/overview | `ProgressCircle` and `Avatar` both exist, but there is no way to compose a ring around an avatar. | An `Avatar` `progress?: number` that draws a ProgressCircle ring with an accessible label. |
| 11 | **EntryFrame split without artwork** | auth/sign-in, auth/sign-up, auth/confirm, auth/reset (1440) | `EntryFrame` split gives the context pane an artwork that takes the free height (`flex: 1`) and puts the intro under it; it hides the identity on desktop. The approved auth board has no artwork: the logo and name sit at the top leading edge and the intro is centred in the block axis beside the card. The app puts the lockup at the head of the intro, so the whole intro sits at the foot of the pane. | A split variant `context="intro"` (no artwork): identity at the context pane top edge, intro centred in the block axis. |
| 12 | **Input height at 390** | auth/* (390) | The auditor measured inputs about 42px tall at 390 while buttons are 40px (DNA-COMMON-CONTROLS-PHONE-40); at 1440 both are 40px. | One 40px control height for Input and Button at every width. |
| 13 | **TextAction tap target** | auth/* (390): "Quên mật khẩu?", "Đăng ký", "Dùng email khác" | `TextAction` draws about 20-40px tall with no extended hit area, below the 44px coarse-pointer target. | An extended hit area (44 by 44) on TextAction under a coarse pointer, as Button has. |

## Not a Grammar gap

- **Sign-in buttons with provider logos** (auth/sign-in, auth/sign-up). Badge's own doc says "product glyph identity remains app-owned". The app passes the GitHub/Google mark through `Button startContent`. The canvas uses letter tiles (GH, G) as placeholders.

## Lane claims that Grammar already covers (notes corrected)

| Claimed gap | Covered by |
|-------------|-----------|
| Bar chart for recall rate (review/hub) | `composite/BarChart` |
| List row with an inline progress bar (practice/list) | `ListRow` `detail`/`value` slot holding a `Meter` |
| Difficulty dot with a word (practice/pattern) | `Badge isDot` (dot + words on a soft fill) |
| Evidence chips ✓ ✕ (projects/detail) | `Badge isDot` with tone `success`/`danger`/`neutral` |
| ProportionBar tone per segment (projects/list) | `ProportionBarPart.tone` (`accent`, `success`, `warning`, `danger`, `neutral`) |
| 5-question bar coloured per answer (Bản chất) | `ProportionBar` with five equal parts, each with its own tone |
| Vertical stepper with Xong / Đang chờ / Cần sửa (projects/connect) | `Stepper orientation="vertical"` + `state` + `stateLabel` |
| Experience flow (Luyện tập → AI chấm → Thầy duyệt → Đã xác minh) | `Stepper` |
| Rubric row with points and "Trọng yếu" (lesson-ladder) | `ListRow` `value` + `badges` + `verdict` |
| Rubric 0–2 in three steps (projects/concept) | `Meter maxValue={2} segments={2}` |
| Evidence row (source, result, facts, question) | `ListRow` `description` + `detail` + `badges` |
| CV bullet with a source label on the right | `ListRow` `badges` |
| Locked list (dim rows with a lock) | `ListRow state="unavailable"` + leading lock icon |
| Copy box for the CV link | `branch/CopyField` |
| Per-test result list (practice/problem) | `ListRow verdict` + `value` |
| Keyboard hint "Phím Space" | `leaf/Kbd` |

## Token notes for the app theme (not Grammar)

- StarCi Next's accent comes from `fe/apps/app/src/modules/brand/brand.css` on origin/dev: `--accent oklch(51% 0.24 285)`, `--accent-soft oklch(95.5% 0.03 287)`, `--accent-soft-foreground #6a3cf2`. In the canvas these live in ONE scope (`.SN` in `pages/00-shared.html`).
- Gray is used for selection: nav items, table rows, chips, the current lesson row and selected plates.
- Measurement fills (progress, streak days, rubric levels) use foreground, not violet.
- Info is a neutral gray, not blue.
