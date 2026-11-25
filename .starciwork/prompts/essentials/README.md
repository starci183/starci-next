# Essentials: a lesson and its lab

The rules for an agent that writes an Essentials lesson and the lab it runs on: the six learner pages, the REF rule that decides which
words a page may use, and what each page holds. [lab.md](lab.md) holds the lab (manifest, cases, ladder, grader, MCP, production repos),
[code.md](code.md) holds how the lab's TypeScript is written and commented.

An Essentials lesson is one incident in one running system, learned by fixing a lab until its cases pass. This is the only generation of Essentials
(owner, 2026-11-26: "đưa essential v2 thành v1, xóa v1 đi"): what was called Essentials v2 is now Essentials, and the five-part lessons and their rules
(Mở đầu, Bản chất, Tìm sạn, Challenges, Pattern) are deleted.

**Reference example: Saga.** Every rule below is shown in the Saga lesson, the only lesson for now:

- the lesson folder `<content repo>/raw/essentials/shop-giay/saga-compensation/` and the course `<content repo>/raw/essentials/shop-giay/course.yaml` in the content
  repository (`starci-next-seed-standard`); it carries `<lesson folder>/starci-lab.yaml` (a fixture built from the Saga spec until the coordinator cuts the real lab; the old nine-beat script is gone);
- the lab `starci-next-labs/shop-giay` (Express, `pg`, `ioredis`, Jest), the framework version `starci-next-labs/shop-giay-nest`;
- the manifest schema `<content repo>/schemas/essentials-lab.schema.json` of the content repository, and the learner flow canvas
  <https://claude.ai/artifact/SGKc7odHDtHZxPKJksQaLj>.

A rule that Saga shows is stated here once; when Saga and a rule disagree, the owner decides and this folder changes.

## What else applies

Read [the shared rules](../shared/) whole first: the refs, Vietnamese, voice, audience and numbers rules apply to every learner-facing word of an Essentials lesson.
Exception: [stack.md](../shared/stack.md) says "no framework"; that holds for the lab, and the NestJS version is one entry of the
production list page 6 compares against ([lab.md](lab.md) "Production repos"). How the relay and the MCP work is not written here: it
is [learner-cli-relay](../../concepts/learner-cli-relay.md) and [mcp](../../concepts/mcp.md). What the
content repository checks of a course and its lab (the manifest against `<course folder>/course.yaml`, the concept graph chain, the ladder, the invariants,
the deps) is `<content repo>/scripts/validate-courses.mjs`, and its adapter writes the lab as the seed set `essentials-labs` without ladder refs, grader
files or MCP urls; this folder never restates either. That no page 1 to 4 word is one of the lesson's own terms is held by review.

## The REF rule

A law of all StarCi Next content: [refs.md](../shared/refs.md). Every learner-facing word of an Essentials lesson and its lab (page copy,
case titles, invariants, hints, MCP answers, the lab README, code comments, test names and messages, the framework version) names only the
lesson's concept, its keywords and its transitive `requires`, and no teaser names a later concept.

For Saga the allowed set is saga (distributed transaction, compensating transaction, bước bù, orchestration, choreography, saga log,
recovery, pivot step) and its requires: request-lifecycle, data-modeling, service-boundary, transaction-acid, timeout, retry,
idempotency-key. Not allowed in Saga: race condition, lock, semantic lock, outbox, 2PC, message queue, BullMQ, dead-letter queue, event
sourcing, CQRS and every other later concept. So a double click is an idempotent checkout (the second checkout of an order returns the
first result), never a lock, and the Nest version retries in a provider with no queue.

## The six pages

A lesson is six pages in this order. Each has one job; content of one page never moves into another. Pages 1 to 4 do not use the
lesson's own terms (`terms` of `<course folder>/course.yaml`); page 5 names them. The tab labels are plain Vietnamese, as below.

The voice is a mentor's (owner, 2026-11-26: "giới thiệu = câu phỏng vấn cho chạm"): the lesson starts from an interview question the
learner would fail today and ends by answering it. The interviewer's questions are quoted in the interviewer's own voice ("em"); the
page around them keeps "bạn" ([voice.md](../shared/voice.md) §2.1). **(đề xuất)**

| Page (tab)         | Its one job                                                  | It holds |
| ------------------ | ------------------------------------------------------------ | -------- |
| 1. Giới thiệu      | ask the interview question, then show the system             | opens with the interview question the learner would fail (manifest `hook`; Saga: "Khách bấm đặt hàng. Tiền trừ rồi thì kho báo hết hàng. Mỗi ô một cơ sở dữ liệu riêng. Em làm sao để khách không mất tiền?"); then the architecture drawn from the manifest (`stack.services`, `stack.deps`, the course's system map), the incident in one scene, the outcomes as ticked "you can do X" lines (manifest `outcomes`, one per case), `requires` as what to know first |
| 2. Cài đặt         | get the lab running on the learner's machine                 | install and pair the relay, choose the directory, the lab at `c0-naive` with its deps up, the commands in the bash form ([stack.md](../shared/stack.md)) |
| 3. Đơn bình thường | prove the system works when nothing goes wrong (happy)       | run the happy cases on the naive code until green, read the one learner file, the invariants each case checks; nothing is broken yet |
| 4. Khi có sự cố    | break it, then fix it until done (unhappy)                   | the unhappy cases in order, each framed as the interviewer's follow-up question (the case's `question`); the case runs red with the chaos it sets and the invariant that failed, the learner edits the learner file and runs the case again, MCP hints in 3 levels and read-only views, the diff to the reference after green, "reset to the reference step" when stuck |
| 5. Tổng kết        | give what the learner built its name                         | opens "Nhớ câu hỏi … không?" with the page-1 question (`recall`; one row per case from its `recap`: did, gain, English name), retells in plain words what the learner did case by case, then names the concept: its name, a short definition, the everyday analogy, the flow, the terms it brings; each unhappy case's `teaches` set against the name |
| 6. Nộp bài         | prove it under the full matrix, then compare with production | the hidden grader matrix run on the learner's relay ([lab.md](lab.md) "The grader matrix"); on a pass, "Muốn biết hệ thống thật làm việc này thế nào?": a table of real, public, production-grade repos (rows; manifest `production`) by the lesson's unhappy-case ideas (columns), cells Có / Nền tảng lo / Một phần / Không / Tự viết; per repo one plain-Vietnamese line on how it does it and how it differs from the learner's file, its link pinned to a commit; then what the learner did that none of these repos ships; last, the answer to the page-1 question (`closing`) ([lab.md](lab.md) "Production repos") |

Page 4 is where the time goes: its cases are the lesson. Their order, titles and hints are the lab manifest's, not page copy; a page reads
the manifest and never restates a case in its own words. The page-6 repo list is the manifest's too, never page copy. Page 6 is not a
reward hand-over: nothing is unlocked as a prize. No page ends with a teaser that names a later concept ("Bài tiếp theo: <concept>",
[refs.md](../shared/refs.md)).

## Page look

Owner, 2026-11-26: "bỏ mấy cái màu tím này đi", "đọc kĩ grammars thiết kế lại chuẩn ux/ui". The pages follow Grammar (in the harness,
`contexts/ui` and `contexts/grammars`); a look bug is fixed once in Grammar, never per page.

- No ALL CAPS eyebrows; sentence case everywhere.
- Font weights 400 and 500 only.
- The accent colour only on the one primary button and the selected tab's underline.
- No coloured chips for terms or categories: plain text, or a neutral chip.
- Lists and tables are hairline rows, not cards.
- Prose is capped at the reading measure, 72ch.
- A success or danger tint only for a real reported result (a case run, the grader's verdict), never for decoration.
- A term's English name is the muted `lang="en"` label beside the Vietnamese ([voice.md](../shared/voice.md) §3).
