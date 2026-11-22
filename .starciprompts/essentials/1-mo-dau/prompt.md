# Prompt: write the Mở đầu (opener) of an Essentials lesson

Read first: `../../shared/*.md`, then `rules.md`, `diagrams.md` and `example.md` in this folder. Check your output against
`checklist.md` before you hand it in.

## Inputs (fill every one; stop and ask if one is missing)

| Input | Where it comes from | Example |
| --- | --- | --- |
| Concept | the lesson title (100% English) | Outbox & Idempotency |
| Business | a real-sounding Vietnamese business and what the learner owns there | Mây Coffee, shop cà phê online; bạn phụ trách backend |
| Night | one incident window with five moments | Black Friday, 21:03 → 23:50 |
| Five essences | the five things the concept forces you to get right, one per moment, in the order the night reveals them | dual write → lease → retry with a fixed key → check-then-act → natural key |
| Numbers | only from the lesson's `scenarios.yaml` runs (and the bug tests) | 37 khách mất điểm, 12 bản trùng, 9 lần gửi |
| Code | real line ranges from `bugs/source/` (the bug) and `solution/` (the fix) | `loyalty/src/handler.ts` 64–72 |

## Steps

1. **Write the night first.** Five moments, each caused by the fix of the previous one or by the load growing. One line per moment.
   This is the spine; every question hangs on it.
2. **For each moment, write the situation** (rules.md §1): the business sentence, at most three numbered system steps, the Kết quả line
   with a number from the inputs, and the collapsed Chi tiết kỹ thuật line.
3. **Write the question with its constraint** (rules.md §2). Read it aloud: if "Bạn sửa thế nào?" would fit, the constraint is missing.
4. **Write four options** (rules.md §3): the right one and three that a normal engineer really picks. For each, one plain-words reason.
   Try to argue for each wrong option for ten seconds; if you can't, replace it.
5. **Write Vì sao** in the fixed order (rules.md §4). Write "Gốc rễ" first as one bold sentence; everything else serves it.
6. **Write the diagrams** (diagrams.md): the full system once, the per-question highlight set, and 0–1 explanation diagram per question.
7. **Pick the code lines** from the inputs; never write code for the opener yourself.
8. **Write "Người phỏng vấn muốn biết"** and the 4-beat answer last.
9. **Run checklist.md.** Then the four Vietnamese passes (`../../shared/vietnamese.md`).

## Output

`sections/1-essential/quiz.yaml` (schema `essentials-quiz@1`), one entry per question with the fields the schema names for: the
situation (`story`, `steps[]`, `result`, `techDetail`), `prompt`, `choices[]` with `reason`, `correctIndex`, `insight` (`happened[]`,
`root`, `fixPlain`, `cost`, `probe`, `answer{symptom,cause,fix,cost}`), `diagram` (Mermaid), `contextHighlight[]`, `code{file,lines,
highlight}`, plus the lesson-level `systemDiagram` and `glossary[]`. Where the schema lacks a field, say so in your report instead of
inventing a key.
