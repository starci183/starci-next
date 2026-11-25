# Rules: Bản chất

Part 2 is hands-on first, theory after. Owner, 2026-11-23: "cách diễn đạt cũ xoay quanh test case và relay hay hơn — lí thuyết suông thì
tệ". The voice is the old StarCi Academy lessons' ("Thực hành dẫn dắt Lý thuyết": a short Senior/Mid hook, the reader runs it, then the
theory), the content is the lesson's own scenarios. The interview framing lives in part 1 Mở đầu; Bản chất never repeats it (no
"Ý interviewer muốn nghe", no "Trả lời mẫu", no interview section).

## The shape

The body (`sections/2-essence/vi.md` and `en.md`, same numbering in both) is, in this order:

1. **One `:::lab{title="Chạy lab"}` block** at the top of the body: prerequisites and ports, `starci-relay login`, `pull`, `npm ci`,
   `docker compose … up`, one round by hand with its recorded output, the line that `starci-relay run` sends results back to the page,
   and the cleanup. The app draws it as a folded panel (right column on a wide screen, "Chạy trên máy tính sau" on a phone); setup never
   sits between explanations.
2. **`## 1.` the night**: a two-or-three-line Senior/Mid hook, the story (company, numbers from the opener), a table of the night's
   moments (time, what happened, lab scenario, chapter and its Mở đầu question), how each chapter reads, the run date of every number, and
   the one system diagram.
3. **One chapter per moment of the night** (`## 2.` to `## N.`), opener order. A chapter, in this order:
   - one line back to its Mở đầu question: "← Câu n ở Mở đầu." plus "Sâu hơn Mở đầu ở chỗ: …" (what the reader now measures);
   - the scene in two or three sentences and what the scenario does;
   - a `:::run` flow with the guard off: the command, the recorded output, the italic "_Kết luận: …_";
   - **Đọc code.**: the few lines that cause it, each fence naming its real file and line range (` ```ts file=src/products.ts lines=123-131 `),
     the lines copied exactly; other code is named by file and line, not pasted;
   - **Cơ chế.**: the mechanism in plain words, and one diagram when a sequence or flow carries it (a `mermaid` fence with `caption=`,
     then its italic caption line; a flowchart branches only out of a `{…?}` decision with `Có` / `Không` edges, `Yes` / `No` in
     `en.md`, as [../../shared/diagrams.md](../../shared/diagrams.md) "Flowcharts" says);
   - **Sửa.** when the fix is a separate step, then a `:::run` flow with the guard on: the number becomes right;
   - **Cái giá.**: what the fix costs, in the lesson's numbers;
   - the self-check: one understanding question (never an interview question) as a marker `:::check{id="ch2-…"}` + `:::` where it
     stands; the question, four options, the one right option and a one-sentence reason per option live in
     `sections/2-essence/reading.yaml` (`checks`, schema `essentials-reading@1`), never in the markdown: the page grades each pick
     on the server like the opener (owner 2026-11-23: no answer leaking);
   - **Hỏi AI qua MCP.**: one or two prompts about this chapter's code or the reader's own run.
4. **The whole path** (one chapter): the function that orders every mechanism, by line range, its diagram, and any scenario no moment
   covered.
5. **`## Bản chất`**: one bold sentence, then bullets (the essence, why it matters in the lesson's numbers, "Verify ở chương N"), then one
   table (mechanism, what it stops, its guard, its cost).
6. **Edge cases**: "**X:** the problem. **Giải pháp:** …", naming the challenge tier when one covers it.
7. **Mang về**: the checklist, then `### Đọc thêm` with real links.

A moment chapter's heading is `## N. HH:MM · <short title, about six words>`: the page's sticky contents show the time and the short
title. The terms a learner may not know are defined once in the same `reading.yaml` (`glossary`: the term exactly as each locale's
prose writes it, one plain sentence); the page explains, in each chapter's margin, the terms that chapter's prose uses.

Headings are `##` (numbered `N.`, the chapters the quiz's `readSection` names) and `###` (unnumbered) only. The seed's
`scripts/validate-five-part.mjs` holds the shape (one `:::lab`, chapters 1..N, no deeper heading, every `:::run` naming a scenario of
`scenarios.yaml`).

## Voice **(đề xuất)**

The prose reads like a Vietnamese developer's blog post (owner: "viết tự nhiên như blog ấy"), held by
[../../shared/voice.md](../../shared/voice.md):

- The Senior/Mid hook opens on a scene of the night with one number from the runs, never on a definition (voice.md §1).
- "bạn" throughout; "mình" only for what the author really ran ("Mình chạy kịch bản này 3 lần"). No "chúng ta sẽ cùng tìm hiểu".
- **Cơ chế.** says who does what (subject and verb), no "việc + V", "được thực hiện", "nhằm mục đích" (voice.md §4.3).
- One everyday analogy per chapter at most, after the run, and it says where it stops holding (voice.md §4.5).
- The italic _Kết luận_ is one sentence with the number, not a summary of the paragraph above it.
- Terms stay as developers say them (cache, TTL, tombstone, request); no calque (voice.md §3.2).

## A flow

```
:::run[Luồng 1 · Tắt version: trang hiện sai 50.000đ]{scenario="stale-after-write" guards="versioned-set"}
(bash fence: starci-relay run <lesson> --scenario <id> --guard <guard>=off)
(terminal fence: the [timeline]/[ledger] lines of the recorded run, verbatim)
*Kết luận: …*
:::
```

- The label says the guard state and the number the reader will see. `guards` lists the guards the flow turns off (none when all are on).
- The command is the relayed one (`starci-relay run`), so the app shows **Lần chạy của bạn** (the learner's newest run of that
  scenario, its state, guards and ledger) under the flow. The plain `npm test -- --scenario <id>` is named once, in the lab block.
- The output is copied from a real run recorded in the lesson's `.e2e/<date>-*.md` (command, date, versions, verbatim output). A number
  not in a recording is not written; when the source changes, record again before writing.

## The source

The source is one TypeScript program run directly by Node 24, with no library beyond Express and the unavoidable database drivers
(owner 2026-11-22: "code chạy không cài lib"): every mechanism the part explains is written by hand and readable. [../../shared/stack.md](../../shared/stack.md)
holds the stack and command rules.
