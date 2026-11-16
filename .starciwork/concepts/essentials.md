# essentials

Bản chất (EN Essentials, id `essentials`) is a separate part that teaches industry knowledge, not knowledge for the harness's agents.
One lesson is one concept in the teacher's concepts V2 format: learned by doing first, graded only by its own rubric, then proved on
real code.

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

## Where
`be/src/modules/domain/lesson/`, `be/src/modules/domain/attempt/`, `be/src/modules/domain/incident/`, `be/src/features/api/lesson/`,
`be/src/features/api/attempt/`, `fe/apps/app/src/app/[locale]/(app)/essentials/`, `fe/apps/app/src/components/blocks/LessonStudy/`

Related: [content](content.md), [ai-teacher](ai-teacher.md), [review](review.md), [premium](premium.md),
[learner-cli-relay](learner-cli-relay.md), [verified-experience](verified-experience.md)
