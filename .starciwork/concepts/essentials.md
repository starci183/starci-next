# essentials

Bản chất (EN Essentials, id `essentials`) is a separate part that teaches industry knowledge, not knowledge for the harness's agents.
One lesson is one concept in the teacher's concepts V2 format: learned by doing first, graded only by its own rubric, then proved on
real code.

## The four parts (owner, binding 2026-11-17)
A lesson page has four parts, the tabs of `/essentials/[topic]/[lesson]?part=`; the six phases below stay as the article and the
legacy `?phase=` pages. We teach the essence, not coding: learners vibe-code with their AI, and code is evidence to read, run and
break.
1. **Bản chất**: five multiple-choice interview questions (`opener`), graded on the spot as choice attempts `opener.<id>`; a wrong
   answer shows the explanation and links its section ("nên đọc kỹ") or its scenario; the same five again at the end show before
   and after. Then the article (the sections).
2. **Source**: `starci-next pull <lesson>` and `starci-next up`, the architecture (mermaid) with a "Luật nó giữ" column, and the code
   walk: each snippet equal to the repository, tagged with its invariant and `file:line`. TypeScript only, no language picker.
3. **Kịch bản**: each scenario with its command, expected output and invariant, run by `starci-next run|check <lesson> --scenario <id>
   [--guard x=off]`; results come back over the relay (task `lesson:<lesson>`, check id = scenario id). Red shows "Vì sao sai" (the
   invariant broken and the hint); the fix goes to the learner's AI ("Hỏi AI sửa": a ready prompt naming the scenario and the
   StarCi MCP connector), then `starci-next check` judges again.
4. **Tự áp dụng**: the ladder easy, medium, hard, insane; a rung is judged by hidden scenarios (relay slot `challenge`, ref = the
   challenge id: "Đang luyện"), an essence check of choices graded deterministically (`challenge.<challenge>.<id>`) and a rubric of
   100 points with at most one critical criterion; GitHub CI with OIDC proves it ("Đã chứng minh").

The fields are optional members of the root file (`opener`, `source`, `invariants`, `architecture`, `codeWalk`, `scenarios`,
`challenges`): a lesson without them imports exactly as before, and the two locales share their structure.

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
- Don't add a language picker to the four parts; a lesson's source is TypeScript.

## Where
`be/src/modules/domain/lesson/`, `be/src/modules/domain/attempt/`, `be/src/modules/domain/incident/`, `be/src/features/api/lesson/`,
`be/src/features/api/attempt/`, `fe/apps/app/src/app/[locale]/(app)/essentials/`, `fe/apps/app/src/components/blocks/LessonStudy/`,
`fe/apps/app/src/components/blocks/EssentialLesson/`, `be/src/modules/domain/lesson/lesson-essential.policy.ts`,
`be/src/modules/domain/relay/relay-lesson.service.ts`

Related: [content](content.md), [ai-teacher](ai-teacher.md), [review](review.md), [premium](premium.md),
[learner-cli-relay](learner-cli-relay.md), [verified-experience](verified-experience.md)
