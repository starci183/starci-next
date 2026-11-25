# Prompt: write the Mở đầu (opener) of an Essentials lesson

Read first: `../../shared/*.md`, then `rules.md`, `diagrams.md` and `example.md` in this folder. Check your output against
`checklist.md` before you hand it in.

## Inputs (fill every one; stop and ask if one is missing)

| Input         | Where it comes from                                                                                      | Example                                                                    |
| ------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Concept       | the lesson title (100% English)                                                                          | Outbox & Idempotency                                                       |
| Business      | a real-sounding Vietnamese business and what the learner owns there                                      | Mây Coffee, shop cà phê online; bạn phụ trách backend                      |
| Night         | one incident window with five moments                                                                    | Black Friday, 21:03 → 23:50                                                |
| Five essences | the five things the concept forces you to get right, one per moment, in the order the night reveals them | dual write → lease → retry with a fixed key → check-then-act → natural key |
| Numbers       | only from the lesson's `scenarios.yaml` runs (and the bug tests)                                         | 37 khách mất điểm, 12 bản trùng, 9 lần gửi                                 |
| Code          | real line ranges from `bugs/source/` (the bug) and `source/` (the fix)                                   | `loyalty/src/handler.ts` 64–72                                             |

## Steps

1. **Write the night first.** Five moments, each caused by the fix of the previous one or by the load growing. One line per moment.
   This is the spine; every question hangs on it.
2. **For each moment, write the scene** (rules.md §1) **(đề xuất)**: one prose paragraph, parts named as developers say them, ending on
   the symptom with a number from the inputs. Identifiers go to Xem kỹ thuật.
3. **Write the question with its constraint** (rules.md §2). Read it aloud: if "Bạn sửa thế nào?" would fit, the constraint is missing.
   What the right option must meet goes into the scene or the question, from the scenario's facts only. **(đề xuất)**
4. **Write four options** (rules.md §3): the right one and three that a normal engineer really picks. For each, one plain-words reason.
   Try to argue for each wrong option for ten seconds; if you can't, replace it.
5. **Write Vì sao** in the order of rules.md §4 **(đề xuất)**: analogy, term, Cách sửa, collapsed Xem kỹ thuật, Nói gọn. Draft "Nói gọn"
   first as one bold sentence; everything else serves it.
6. **Write the diagrams** (diagrams.md): the full system once and 0–1 explanation diagram per question, in Xem kỹ thuật. **(đề xuất)**
7. **Pick the code lines** of Xem kỹ thuật from the inputs; never write those yourself. **Write the blog snippets** (rules.md §6): owner
   2026-11-24, "xen kẽ demo code minh họa (english/vietnam comment)": the scene, Bối cảnh and each Học thêm of the glossary carry a short
   snippet in their prose, 3 to 12 lines of TypeScript named as the lesson's `source/` names things, each key line commented in both
   languages (`// cache hit → trả luôn / return without touching the DB`).
8. **Write "Người phỏng vấn muốn biết" and the 4-beat answer** last, inside Xem kỹ thuật (owner decision 1, rules.md end).
9. **Run checklist.md.** Then check with the four Vietnamese skills (`../../shared/vietnamese.md`); the blog voice wins. **(đề xuất)**

## Output

`sections/1-essential/quiz.yaml` (schema `essentials-quiz@1` of starci-next-seed-standard, `schemas/essentials-quiz.schema.json`;
the authoring table is its `docs/authoring.md` "Mở đầu"). Lesson level: `story` (`title`, `hook` the opening one or two sentences,
`body` Bối cảnh in paragraphs split by a blank line, `closing` (`body` the closing paragraphs, `question` one question to the reader,
both required when `closing` is present), `company`, three `facts`, `illustration` (`key`, `alt`: the picture of Bối cảnh)), `system`
(`diagram`, `caption`, `legend[]` (`tone`, `label`): rules.md §6) and `glossary[]` (`term`, `definition`, `more`: Học thêm). Per question:
`illustration` (`key`, `alt`: the picture of the scene), `event` (`at` the time, `text` one sentence that does not repeat it; it is the hand-off line under the
question before it), `title`, `steps[]` (the scene's prose paragraphs, not numbered), `symptom` (the scene's last sentence, the symptom
with its number), `technical` (the first line of Xem kỹ thuật: its identifiers), `prompt`, `options[]` (`text`, `explanation` = its
reason, exactly one `correct`), `probe`, and `insight`: `analogy` (anh Senior's everyday picture), `term` (the paragraph that names the
term, each term in `**bold**`), `fix` (Cách sửa, paragraphs split by a blank line), `stateLabel` (the header of the walk-through
table's third column, e.g. "Redis đang giữ"), `happened[]` (`who` (may be empty), `text`, `state` (the third-column cell), `group`
(a group label that starts a new group of rows, e.g. "Trước khi sửa"), `fault`), `why` (the prose of Xem kỹ thuật after the table,
paragraphs split by a blank line), `diagram`, `diagramCaption`, `cost` (Lưu ý), `code` (`file`, `lang`, `start`, `highlight[]`,
`code`, `note`), `essence` (Nói gọn) and `interview` (`symptom`, `cause`, `fix`, `cost`). Leave out `condition`, `contextDiagram` and
`contextCaption`: the page draws none of them.
