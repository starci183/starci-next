# essentials

Bản chất (EN Essentials, id `essentials`) is a separate part that teaches industry knowledge, not knowledge for the harness's agents.
One lesson is one concept in the teacher's concepts V2 format: learned by doing first, graded only by its own rubric, then proved on
real code.

## The five parts (owner, 2026-11-21 spec, canvas approved 2026-11-22)
Access is partial: Mở đầu is free for everyone, the other four need Premium (setting `ENTITLEMENT_ESSENTIAL_FREE_PARTS`, see
[premium](premium.md)). A lesson page is a compact header (the English keyword title, one Vietnamese line, one meta line: topic, time,
parts done), the five parts as the header's underline tabs on every part and at every width (owner 2026-11-23: navigation is the
secondary underline tabs; a locked part carries the lock and still opens) and one part body in `/essentials/[topic]/[lesson]?part=`;
on Mở đầu the header also says the question's place ("1 / 5"); there is no rail; `?part=end` is the end of the lesson ("trước và sau"). There is no hero picture; the
only side column is the margin of Mở đầu (the glossary terms its prose uses, before and after the answer; a term with Học thêm opens it in a side
sheet: a few sentences and a demo snippet). The prose of Mở đầu reads like a blog post: a picture per scene and short snippets with
bilingual comments between its paragraphs (owner 2026-11-24; `.starciprompts/essentials/1-mo-dau/rules.md` §6). We teach the essence, not coding: learners vibe-code with their AI, and code is evidence to read, run and break.
1. **Mở đầu** (`essence`): one shared night and five interview questions in sequence, each with a time in the night and four
   options, one question on screen at a time. Before question 1 the opening: the eyebrow "Mở đầu · 5 câu · một đêm", the story's
   title, its hook as the lede, its picture, "Bối cảnh" in paragraphs and the whole system as a Mermaid figure (vendor logos on the parts,
   links coloured by path with a legend) with its caption. Per question: the eyebrow "Câu N / 5 · HH:MM" and the question's title, the
   scene's picture, "Chuyện gì xảy ra" in prose paragraphs ending on the symptom, the question in
   bold, then the options. A wrong pick is crossed, shows its one-sentence reason and stays locked; the learner picks again. The right
   pick ticks, shows the reason of all four options and opens "Vì sao": anh Senior's everyday picture as a quote, the paragraph that
   names the term, "Cách sửa", then "Xem kỹ thuật" folded (the identifiers, "Đi từng bước" as a table with the faulty step marked
   "chỗ hỏng" and an optional third column of what the watched part holds, grouped rows, the prose after it, the figure, "Lưu ý", the
   code, "Người phỏng vấn muốn biết" and the four-beat "Trả lời phỏng vấn" with its copy command), and "Nói gọn:" with the essence.
   A one-line hand-off (the next time and what happens then) stands beside "Câu tiếp theo"; after the last question "Hết đêm" closes
   the night with its paragraphs and one question to the reader before the result. The result is "đúng ngay lần đầu x/5" with a row
   per question and a link to the heading of Bản chất to read again. Feedback is released per pick: a wrong pick answers its own
   option only; a right pick releases every option's reason and the insight.
2. **Bản chất** (`source`): the practice-led reading (`sections/2-essence`) by chapter (owner 2026-11-23): a sticky contents of the
   chapters by their time in the night (on a phone one sticky chapter bar on top) with "Nên đọc kỹ" where the opener was missed, the
   glossary terms each chapter uses in its margin (opened in place under the term on a phone), code blocks that name their file, and a
   self-check closing each chapter, graded on the server one pick at a time like the opener (`check.<id>`; the key and the reasons stay
   on the server until a pick); the lesson's MCP and the lab are compact tools after the first chapter, never before the reading.
3. **Tìm sạn** (`scenarios`): the bug pack run on the learner's machine through the relay; a row per test, a red one opens its symptom,
   the two numbers and its three hints one at a time; Challenges opens when every test passes.
4. **Challenges** (`apply`): the ladder easy to insane, judged by hidden scenarios, a rubric, interviewer push-back questions and a
   written explanation from the Khó rung up; GitHub CI with OIDC proves it ("Đã chứng minh").
5. **Pattern** (`pattern`): the same five essences in a real framework per stack (three questions, a snippet, the main files); not graded.

The fields are optional members of the root file (`opener`, `source`, `invariants`, `architecture`, `codeWalk`, `scenarios`,
`challenges`, `bugs`, `patterns`): a lesson without them imports exactly as before, and the two locales share their structure. The
page renders the content fields as authored: the content is written short (the question one line, an option a few words, a reason one
sentence), never shortened by the page.

## Terms
- **Lesson** ("bài"): one concept. Levels: group (one of 16) → topic (one source module) → lesson; routes `/essentials`,
  `/essentials/[topic]`, `/essentials/[topic]/[lesson]`. The old names "Knowledge Shard" and "mảnh kiến thức" are not used.
- **Phase**: challenge (diagnostic interview, "Bị hỏi"), predict, explore (state-machine simulation), explain (theory), apply
  (workspace tests with one seeded break, then a transfer exercise), reflect (re-interview).
- **Activity kind**: explain, choice, simulation, exercise, retrieval; each carries a rubric (criterion, expected evidence,
  misconception).
- **Outcome level**: "hiểu" (understood, from the browser phases) and "chứng minh" (proved, from incident evidence).
- **Tier**: 1 in the browser; 2 Sự cố, an incident on the teacher's real repo with seeded bugs; 3 the optional V1 challenge ladder.

## Rules
1. The learner acts before reading: the diagnostic question first, a prediction before the simulation runs, the seeded break before
   the theory of why. The reflect phase asks the diagnostic again with the same rubric and shows before and after per criterion.
2. Feedback is released only after submit; no answer key, expected evidence, option explanation or hidden test is in a payload earlier.
3. A hint never blocks completion; an attempt that used one is labelled "có hỗ trợ".
4. Progress is per learning outcome at the two levels, never a percentage read. An attempt raises at most understood. Proved needs a
   passing incident whose mutation score is at least 80 percent (learner-written tests count); a graded attempt never sets proved.
5. The lab's apply phase runs green first, then the one named break turns a test red, the learner explains it, restores green, and only
   then submits. Changing the code language restarts the lab; every language shares one behavioural test contract.
6. An incident ticket describes production symptoms, never the faulty line. The local check reports how many seeded bugs survive,
   never where. Grading runs base flows, hidden flows and the learner's tests against hidden mutants in an isolated sandbox.
7. The category tree is 16 groups by knowledge area over the merged Fullstack, System Design, DevOps and AI/LLM courses (owner):
   overlapping lessons become one lesson per concept split by difficulty; cloud lessons are one per concept with a provider facet (AWS,
   GCP, Azure, DigitalOcean); case studies are a collection above the lessons. A topic slug never equals a lesson id, and a lesson with
   no group or topic is refused at import.
8. Concept text is written once; only code-bearing parts vary by language (TypeScript, Java, C#, Go). A language the lesson lacks shows
   "đang soạn" and cannot be chosen.
9. V1 courses are source material only, cited by sha; a V2 lesson is rewritten, never a V1 lesson edited in place.

## Example
`/essentials/backend-framework/request-response-lifecycle`: the band, one list card of the six phases with a state chip or a lock each,
and an aside with the learning result, the retrieval after 1, 7 and 21 days and the references.

## Don't / Instead
- Don't invent a flow of our own; use the six V2 phases.
- Don't mark proved from an exercise score; wait for the incident's mutation score.
- Don't send a question's right index or explanation before its submit; the view lists the choice words only.
- Don't add a language picker to the five parts; a lesson's source is TypeScript.

## Where
`be/src/modules/domain/lesson/`, `be/src/modules/domain/attempt/`, `be/src/modules/domain/incident/`, `be/src/features/api/lesson/`,
`be/src/features/api/attempt/`, `fe/apps/app/src/app/[locale]/(pages)/(app)/essentials/`, `fe/apps/app/src/components/blocks/LessonStudy/`,
`fe/apps/app/src/components/blocks/EssentialLesson/`, `be/src/modules/domain/lesson/lesson-essential.policy.ts`,
`be/src/modules/domain/relay/relay-lesson.service.ts`

Related: [content](content.md), [ai-teacher](ai-teacher.md), [review](review.md), [premium](premium.md),
[learner-cli-relay](learner-cli-relay.md), [verified-experience](verified-experience.md)
