# content

The teacher's content lives in git outside the app and reaches it without a release, the way starci-academy-backend pulls
starci-lab/data. The app renders and grades that content; it never owns or rewrites it.

## Terms
- **Teacher's data**: `starci-lab/data` (concepts V2 lessons, interview banks, flashcard decks, coding problems, V1 courses).
- **Content repo**: the private `starci183/starci-next-seed-standard` (renamed from `starci-next-data` on 2026-11-17; GitHub
  redirects the old address and the manifest reader takes both `schema` names): our own Bản chất lessons under `essentials/`, the interview overlay and
  the catalogs (projects, agent lab, incidents, experience, outcome paths).
- **Snapshot**: one pulled commit under `<CONTENT_DATASOURCES_DIR>/<sha>/` with a `manifest.json`; every importer runs at that version.
- **Placeholder**: content we wrote while the teacher has not, marked status `draft` and author `ai-placeholder`.

## Rules
1. The build never waits for the teacher, and nobody asks the teacher to write before shipping: we write placeholders, push them to the
   content repo, and the teacher replaces them later (owner).
2. Every placeholder is marked `draft` / `ai-placeholder` so the teacher can find it; an unmarked placeholder is a defect.
3. Content text never has its source of truth in the app repo; dev seeds are copies of a snapshot.
4. An imported version is immutable: the ref (a git sha) is the version, the content hash is stored beside it, and the same version
   with other bytes is refused.
5. The app shows the teacher's text and rubrics as written. A missing piece shows as missing ("đang soạn", "Sắp có"), never invented.
6. Content that would give the answer away is not shown: an interview stem that still repeats 18 or more consecutive words of its
   ideal answer or checklist is left out of the import until the teacher writes a stem.
7. Lessons are written by topic, and a lesson's source code is TypeScript only (owner 2026-11-17).
8. Pull credentials come from sealed custody (`CONTENT_GIT_TOKEN`, `CONTENT_DATA_GIT_TOKEN`); local checkouts (`--dir`,
   `--data-dir`) need none.

## Example
`cli content sync` pulls both repos at their refs into snapshots, imports the teacher's `concepts/` first, then our numbered
`essentials/` and the topic lessons of `raw/essentials/<topic>/<lesson>` (the topic page comes from `raw/essentials/<topic>/topic.yaml`,
not from code; the catalog of the code only answers a topic that has no file). Interview overlay and practice sets are read from
`raw/interview/overlay` and `raw/practice`, falling back to the root `interview/overlay` and `practice` of an older pin. A
placeholder interview stem appears with its draft mark until the teacher edits the content repo.

## Don't / Instead
- Don't edit a V1 lesson in place; a V2 lesson corrects it in its "Điều chỉnh nhận thức" section.
- Don't build or seed a sample project or invented lab text; ship the empty state ([projects](projects.md)).

## Where
`be/src/modules/domain/content/`, `be/src/features/cli/content/`

Related: [essentials](essentials.md), [mock-interview](mock-interview.md), [learning-program](learning-program.md)
