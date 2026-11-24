# essentials-v2

Essentials v2 teaches one concept per lesson through one lab: happy cases that must pass and unhappy cases the learner makes green on
their own machine through the relay. The back end is the `course` capability; v2 lives beside the current lessons ([essentials](essentials.md))
until the owner switches the product over.

## Terms
- **Lab**: the lesson's hands-on project. A lab declares its stack, its happy and unhappy cases and one file the learner edits.
- **Case**: one scenario with a chaos setting and the invariants it must keep. **Happy** cases must pass; **unhappy** cases fail until fixed.
- **lab@2 record**: the lesson's record in the seed standard, set `essentials-labs`, key = lesson id, schema
  `starci-next-seed-standard/essentials-lab@2`.
- **Six pages**: intro, setup, happy loop, unhappy loop, name the pattern, submit.
- **Reference step**: the known-good step of an unhappy case (`hasReference`); the learner may reset to it.
- **Lesson page**: `/essentials-v2/[lesson]?page=` draws the six pages from the lab@2 record as the header's page tabs; `?case=` names the case a loop opens on. A page reached before the one it needs says what is missing and still reads.

## Data
`course_labs` (versions of the record: lesson_id, version label from the content hash, record jsonb, published), `course_case_runs` (one
row per uploaded run, unique client event id), `course_case_marks` (per learner and case: hints_opened 0 to 3, ever_green, last reset).

## Naming
Tables `course_*`, errors `COURSE_*` (`COURSE_PREMIUM_REQUIRED`, `COURSE_LESSON_NOT_FOUND`, `COURSE_CASE_NOT_FOUND`, `COURSE_CASE_LOCKED`,
`COURSE_HINT_OUT_OF_ORDER`, `COURSE_HINT_NOT_FOUND`, `COURSE_PAYLOAD_INVALID`). Doors: `courseLesson`, `courseCases`, `openCourseHint`; device uploads `relayLabCaseResult`, `relayLabCaseHint`, `relayLabCaseReset`.

## Rules
1. A case is open when it is the first happy case or the case before it (happy in order, then unhappy in order) was ever green.
2. The diff is available once the case was ever green; the reset only on an unhappy case with a reference step.
3. A hint level opens only when the level below is open, on an open case; its text is released only for opened levels (conventions rule 4).
4. A record is a version by content hash: the same hash changes nothing, other content supersedes the live version, a label seen again with
   other bytes is refused. A key that is not the lesson id is refused.
5. A device uploads `case.result`, `case.hint` and `case.reset` as the shared relay protocol (`be/src/modules/platform/relay-protocol`) writes them,
   with its device token; a run is idempotent per client event, and a green run of a locked case is kept but opens nothing.
6. Grading runs on the learner's relay and reads "Đã chấm trên máy học viên": practice level ("Đang luyện"), never proof
   ([learner-cli-relay](learner-cli-relay.md)). The web never sees the grader beyond its matrix dimensions.
7. REF RULE: every learner-facing word (copy, hints, MCP answers, README, comments, test messages) names only the lesson's own concept,
   its keywords and the transitive `requires` of that concept; no teaser for a later concept.
8. The lab is Essentials part `4-apply`: Premium by the one entitlement question ([premium](premium.md)).
9. The lesson page names the lesson's concept only on the naming page (page 5): the intro and the loops show case titles, invariants and chaos in plain words and never the concept's term or a `teaches` value. The architecture diagram, the cases list, the hint ladder and the relay command lines are all drawn from the record and `courseCases`; the page holds no word of one lesson.

## Example
A learner opens the unhappy loop: `courseCases` answers `currentCaseId` = the first unhappy case, the next ones locked. They ask for hint 2
first: `COURSE_HINT_OUT_OF_ORDER`. They open 1, then 2, fix the code, run green; the diff opens and the next case unlocks.

## Don't / Instead
- Don't send a closed hint, a grader file or a hidden test to the web; send `text: null` and the matrix dimensions.
- Don't unlock a case from a client-reported status; unlock from the stored ever-green mark.
- Don't edit a stored version; add a new one.

## Where
`be/src/modules/domain/course/`, `be/src/features/api/course/`, `be/src/modules/platform/relay-protocol/`, `db/migrations/20261125100000_course.sql`,
`fe/apps/app/src/app/[locale]/(pages)/(app)/essentials-v2/`, `fe/apps/app/src/components/blocks/CourseLesson/`, `fe/apps/app/src/hooks/courseLesson/`, `fe/apps/app/src/modules/course-lesson/`,
`fe/packages/starci-next-ui/src/composites/CourseIntro/`, `fe/packages/starci-next-ui/src/composites/CourseCaseLoop/`, `fe/packages/starci-next-ui/src/composites/CoursePattern/`

Related: [essentials](essentials.md), [content](content.md), [learner-cli-relay](learner-cli-relay.md), [premium](premium.md), [mcp](mcp.md)
