# content

The teacher's content lives in git outside the app and reaches it without a release, as a pinned seed standard the harness loads
at bring-up. The app renders and grades that content; it never owns or rewrites it.

## Terms
- **Seed standard**: the private `starci183/starci-next-seed-standard`. People author under `raw/` (Essentials lessons and topics,
  the Projects check set); its `adapter/` converts them into `manifest.json`, `data/`, `blobs/` and `index/` (PROJECT-STACKS-13).
- **Pin**: the commit `data.sets` of `.starcistacks/application-stacks.yaml` names (set `content`). The loader reads the standard at
  that commit only; a moved pin is reported `DATA_STANDARD_CHANGED` until the set declares `force: true`.
- **Seed door**: `cli data database <verb>`, the `adapter.command` of the `database` store. It serves the store over
  `starci/data-entries@1`; each set of the standard is written by the capability that owns its tables (lessons and topics by
  `lesson`, the check set by `project`).
- **Placeholder**: content we wrote while the teacher has not, marked status `draft` and author `ai-placeholder`.

## Rules
1. The build never waits for the teacher, and nobody asks the teacher to write before shipping: we write placeholders, push them to the
   standard, and the teacher replaces them later (owner).
2. Every placeholder is marked `draft` / `ai-placeholder` so the teacher can find it; an unmarked placeholder is a defect.
3. Content text never has its source of truth in the app repo; dev seeds are copies of a standard.
4. A lesson version is immutable: its label is the head of the content hash, and the same label with other bytes is refused. A changed
   lesson is a new version that supersedes the live one; a moved placement (group, topic, order) only updates the row.
5. The app shows the teacher's text and rubrics as written. A missing piece shows as missing ("đang soạn", "Sắp có"), never invented.
6. Lessons are written by topic, and a lesson's source code is TypeScript only (owner 2026-11-17).
7. There is one way in: the bring-up's seed step. No command, variable or clone of the standard's repository exists in the app (R435).
8. A set the standard carries and no capability holds is refused (`SEED_SET_NOT_HELD`) and the pin is not applied, so a new kind of
   content never arrives unread; the sets of the retired mock interview are acknowledged and written nowhere.

## Example
The first bring-up at the pin applies it: `lesson-topics` and `lessons` upsert by topic slug and lesson id, `project-catalog`,
`project-probes` and `project-kit` upsert into `project_check_documents`, and a receipt `content@<commit>` is written. The second
bring-up at the same pin skips it. To publish new content: commit `raw/`, run the adapter, merge to the standard's main, then move
`commit` in `application-stacks.yaml` (with `force: true` for that commit).

## Don't / Instead
- Don't edit a V1 lesson in place; a V2 lesson corrects it in its "Điều chỉnh nhận thức" section.
- Don't build or seed a sample project or invented text; ship the empty state ([projects](projects.md)).
- Don't add a command that pulls the standard's repository; declare it in `data.sets` and add the set to the door.

## Where
`be/src/modules/integrations/seed/` (the store and the door), `be/src/features/cli/data/` (`cli data database`),
`be/src/modules/domain/lesson/lesson-seed.set.ts`, `be/src/modules/domain/project/project-check-document.set.ts`

Related: [essentials](essentials.md), [learning-program](learning-program.md)
