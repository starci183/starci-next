# essentials

Essentials teaches one concept per lesson through one lab: happy cases that must pass and unhappy cases the learner makes green on
their own machine through the relay. The back end is the `course` capability; since the owner's ruling of 2026-11-26 ("đưa essential v2 thành v1, xóa v1") this is the only Essentials: the old five-part lessons are deleted from the app and from the seed (sets `lessons` and `lesson-topics` are gone; the lesson domain of the back end stays until it is retired).

## Terms
- **Lab**: the lesson's hands-on project. A lab declares its stack, its happy and unhappy cases and one file the learner edits.
- **Case**: one scenario with a chaos setting and the invariants it must keep. **Happy** cases must pass; **unhappy** cases fail until fixed.
- **lab@2 record**: the lesson's record in the seed standard, set `essentials-labs`, key = lesson id, schema `starci-next-seed-standard/essentials-lab@2`; its optional `chaos` [{id, label {vi, en}}] names each switch the cases use, and the page shows nothing else (a switch with no label reads `KEY=value`).
- **Lab files record**: set `essentials-lab-files`, key = lesson id, schema `starci-next-seed-standard/essentials-lab-files@1`: `base`, `test` {command, cases, report, timeoutMs}, `grader` {command, into, cells}, and the files `source` (the c0 checkout), `framework.nestjs` and `hidden` (under `grader/`), each {path, sha256, text}. SERVER-ONLY.
- **Narration** (lessons.md §9, owner 2026-11-28): the mentor's lines of the record (hook scene, stuck and promise, outcomes, situations, hints, recap, recall, `closing.beyond`, architecture flow and why) are one line of inline markdown each (bold service names, `code`), drawn with the mentor's photo and the label "Thầy StarCi"; the record's `terms` (keyword -> one sentence, `named` for the concept's own words, handed out only on the naming pages) gives each keyword a dotted underline and a hover or tap note (Grammar `GlossaryTerm`) where it first stands in a section. Quotes (the interviewer's questions, the model answer) stay plain, under the asker's label (`hook.asker`).
- **Course**: lessons that grow one system. Its record: seed standard set `essentials-courses`, key = course id, schema `starci-next-seed-standard/essentials-course@1` (vi and en title and summary, lab, system `nodes` and `edges`, `lessons` {id = lab key, node, concept, terms}). **Catalog**: the courses with their lessons.
- **Six pages**: intro, setup, happy loop, unhappy loop, name the pattern, submit.
- **Reference step**: the known-good step of an unhappy case (`hasReference`); the learner may reset to it.
- **Lesson page**: `/essentials/[course]/[lesson]?page=` (the catalog is `/essentials`, the sidebar's Essentials; every old `/essentials-v2/...` address redirects for good) draws the six pages from the lab@2 record as the header's page tabs; `?case=` names the case a loop opens on. A page reached before the one it needs says what is missing and still reads.
- **Rung**: the learner file at one step of the lab's git ladder (base c0, then one rung per unhappy case). The record carries every rung (`rungs`, base first) and each unhappy case's `ref`; they are server-only and served one file at a time as the kind `rung:<tag>`.

## Data
`course_labs`, `course_lab_files` (server-only) and `course_courses` (versions of a record: lesson or course id, version label from the content hash, record jsonb, published), `course_case_runs` (one row per
uploaded run, unique client event id), `course_case_marks` (per learner and case: hints_opened 0 to 3, ever_green, last reset).

## Naming
Tables `course_*`, errors `COURSE_*` (`COURSE_PREMIUM_REQUIRED`, `COURSE_LESSON_NOT_FOUND`, `COURSE_CASE_NOT_FOUND`, `COURSE_CASE_LOCKED`,
`COURSE_HINT_OUT_OF_ORDER`, `COURSE_HINT_NOT_FOUND`, `COURSE_PAYLOAD_INVALID`, `COURSE_RUNG_LOCKED`, `COURSE_RUNG_NOT_FOUND`, `COURSE_NOT_FOUND`). Doors: `courses`, `course`, `courseLesson`, `courseCases`, `openCourseHint`; device uploads `relayLabCaseResult`, `relayLabCaseHint`, `relayLabCaseReset`; device rung doors `relayLabRung`, `relayLabCaseResetTo`.

## Rules
1. A case is open when it is the first happy case or the case before it (happy in order, then unhappy in order) was ever green.
2. The diff is available once the case was ever green; the reset only on an unhappy case with a reference step. The learner's source holds the base rung alone (shipping the ladder would hand out every answer on day 1): `relayLabRung` serves a case's two rungs (the one before its fix and its own) only once the server holds the case's ever-green mark (`COURSE_RUNG_LOCKED` before, `COURSE_RUNG_NOT_FOUND` for any other tag), and `relayLabCaseResetTo` takes the `case.reset` upload, records it and serves the case's own rung, at any time. Neither `rungs` nor `ref` is ever projected to the web.
3. A hint level opens only when the level below is open, on an open case; its text is released only for opened levels (conventions rule 4).
4. A record is a version by content hash: the same hash changes nothing, other content supersedes the live version, a label seen again with other bytes is refused. A key that is not the lesson id is refused.
5. A device uploads `case.result`, `case.hint` and `case.reset` as the shared relay protocol (`be/src/modules/platform/relay-protocol`) writes them, with its device token; a run is idempotent per client event, and a green run of a locked case is kept but opens nothing.
6. Grading runs on the learner's relay and reads "Đã chấm trên máy học viên": practice level ("Đang luyện"), never proof ([learner-cli-relay](learner-cli-relay.md)). The web never sees the grader beyond its matrix dimensions.
7. REF RULE: every learner-facing word (copy, hints, MCP answers, README, comments, test messages) names only the lesson's own concept, its keywords and the transitive `requires` of that concept; no teaser for a later concept.
8. The lab is Essentials part `4-apply`: Premium by the one entitlement question ([premium](premium.md)). The catalog (`courses`, `course`) is free for any signed-in learner. A lesson is `available` when a lab record of it is live; its `conceptTerm` is the lab's allowed term for its concept (else the concept id) and, the lab record having no title yet, its title in both languages. A course record is versioned like a lab (rule 4); a key that is not the course id is refused (`COURSE_KEY_MISMATCH`).
9. On the catalog a lesson card may name the lesson's own concept. The lesson page names the lesson's concept only on the naming page (page 5): the intro and the loops show case titles, invariants and chaos (the record's own labels) in plain words and never the concept's term or a `teaches` value. The architecture diagram, the cases list, the hint ladder and the relay command lines are all drawn from the record and `courseCases`; the page holds no word of one lesson.
10. The lab files set is server-only (conventions rule 4): table `course_lab_files`, an immutable version per content hash, a key that is not the lesson id refused (`COURSE_LAB_FILES_KEY_MISMATCH`), every sha256 the text's own and no grader file in a learner cut. No door, type or web read carries it (the project check `ext/checks/course-lab-files-server-only.mjs` reads the served schema in every `starci app check`); only the relay does, as below.
11. The port: the course capability answers the relay's `RELAY_LAB_CONTRACT` (`CourseLabContractAdapter`, provided and exported by the global `CourseModule`) from the live lab record, the live lab files record and a live course that names the lesson. `contractOf` is the lab folder (`dir` `.`, `docker-compose.yml`), the services, `learnerFile`, the test block (`cases` `{ids}` becomes the relay's `{id}`), the grading (cells as scenarios, the record's matrix) and the chaos switches (ids in lowercase hyphens, commands that set the lab's own `PUT /lab/chaos`); `labFilesOf` is `source` for `bugs`, `framework.nestjs` for `framework:nestjs` and empty for `solution` (the set carries none); `hiddenOf` and `hiddenTestIdsOf` are `hidden` and the cell ids.

12. The standard reference (owner, 2026-11-26): one public repository per lesson in the GitHub organisation `starci-next`, named `essential-<lesson>`
    (Saga: `starci-next/essential-saga`), one top-level folder per language (`typescript/` now, `go/` and `rust/` later), standalone (no harness
    dependency), written to the harness pattern rules of the lesson's concept; the learner's lab repository stays private. The submit page, once
    the learner passed, shows it as the gift's first card ("Bản chuẩn StarCi": its note, the day it was checked and the relay command that fetches
    it), then the production repos as rows, each its note and pinned files; no verdict table, no code and no diff on the page (lessons.md §7,
    owner 2026-11-28). The verdicts stay in the record for the relay and later pages. Its repository, pinned commit
    and folders live once in `platform/relay-protocol` (`LESSON_REFERENCES`); its verdicts per unhappy case and its note in `course-reference.policy.ts`.
    `courseLesson.reference` carries it on the named pages only, and only when the commit is a full sha and the verdicts name exactly the record's
    unhappy cases; it is a link (repo, commit, folder url, relay command, verdicts, note), never file text (`ext/checks/course-lab-files-server-only.mjs`
    pins its shape). `starci-relay ref <lesson> [--lang]` downloads that folder at that commit next to the lab, with no login.

## Example
A learner opens the unhappy loop: `courseCases` answers `currentCaseId` = the first unhappy case, the next ones locked. They ask for hint 2
first: `COURSE_HINT_OUT_OF_ORDER`. They open 1, then 2, fix the code, run green; the diff opens and the next case unlocks.

## Don't / Instead
- Don't send a closed hint, a grader file or a hidden test to the web; send `text: null` and the matrix dimensions.
- Don't unlock a case from a client-reported status; unlock from the stored ever-green mark.
- Don't edit a stored version; add a new one.

## Where
`be/src/modules/domain/course/`, `be/src/features/api/course/`, `be/src/modules/platform/relay-protocol/`, `db/migrations/20261125100000_course.sql`, `20261125110000_course-courses.sql` and `20261125120000_course-lab-files.sql`,
`fe/apps/app/src/app/[locale]/(pages)/(app)/essentials/`, `fe/apps/app/src/components/blocks/CourseLesson/`, `fe/apps/app/src/hooks/courseLesson/`, `fe/apps/app/src/modules/course-lesson/`,
`fe/packages/starci-next-ui/src/composites/CourseIntro/`, `fe/packages/starci-next-ui/src/composites/CourseCaseLoop/`, `fe/packages/starci-next-ui/src/composites/CoursePattern/`

Related: [essentials](essentials.md), [content](content.md), [learner-cli-relay](learner-cli-relay.md), [premium](premium.md), [mcp](mcp.md)
