# conventions

How StarCi Next names its capabilities, tables, keys, error codes, doors, days and words, and how it proves behaviour. It narrows the
generic back-end and front-end rules of the harness to this app; when code and this page disagree, the code is wrong or this page is
edited in the same change.

## Terms
- **Capability**: one folder of `be/src/modules/domain/<capability>/` (lesson, attempt, review, practice, project, career,
  purchase, entitlement, streak, hub, relay, content…). It owns its tables, its error class and its ports.
- **Door**: a GraphQL query or mutation under `be/src/features/api/<capability>/`. *Not to confuse with* a REST route, which exists only
  for a probe, an auth handshake, a signed webhook or a byte transfer.
- **Learner**: any signed-in identity with no operator role; `learner_id` is the account id.
- **Part** (owner's word "shard"): one learning area of the program; see [learning-program](learning-program.md).

## Naming
- Tables: plural `snake_case`, prefixed by the capability: `lesson_versions`, `lesson_topics`, `lesson_incident_scores`,
  `review_settings`.
- Columns: `snake_case`; a key is `<noun>_id` (`item_id`, `decision_id`, `learner_id`); a reference whose role matters names the role
  (`assignee_id`, `signer_id`, `actor_id`); time is `<verb>_at timestamptz`, a calendar day `<noun>_on`.
- Migrations: `persistence/migrations/<epoch ms>-<kebab-slug>.ts` inside the capability, stamps strictly increasing.
- Error codes: `<CAPABILITY>_<REASON>` in upper snake case (`LESSON_PREMIUM_REQUIRED`, `ATTEMPT_COACH_LIMIT_REACHED`,
  `CAREER_REVIEW_NOTE_REQUIRED`); one enum, one kind map (not-found, conflict, invalid, forbidden) and one
  `<Capability>Error` class per capability, in `errors/`.
- Queries are nouns (`lessons`, `lessonProgress`, `recallItem`), mutations verb-first (`submitLessonAttempt`, `submitPractice`).
- Settings are environment keys prefixed by the capability (`PRACTICE_SUBMISSIONS_PAGE`,
  `PROJECT_FREE_PROJECTS`); a business number the owner may retune is a setting with a default, never a literal in code.

## Rules
1. A premium refusal is the capability's own `*_PREMIUM_REQUIRED` code, read from the one entitlement question; no capability keeps a
   second gate ([premium](premium.md)). Practice and Review are free for every learner and ask no entitlement question.
2. A learner's calendar day (streak, due dates, review deadlines) is a day in `Asia/Ho_Chi_Minh`. A
   fair-use cap and a Premium term are counted in UTC. Why: the learner lives by local days; caps and billing need one clock.
3. Every learner-facing word exists in `vi` and `en`; Vietnamese is the first language and the product's own terms are Vietnamese
   (Bản chất, Ôn tập, Luyện code, Dự án, Sự cố, Đang luyện, Đã chứng minh, Đã xác minh).
4. Grading data (answers, rubrics, expected evidence, hidden tests, ideal answers) never leaves the server before the matching
   submit. Why: every part grades recall and reasoning, and a payload that carries the key teaches nothing.
5. A write the learner makes (an answer, a self-grade, a submission) is stored before anything is graded or shown next, and a resend
   is idempotent. Why: a provider failure or a retry must never lose or double the learner's work.
6. Behaviour is proved by the specs under `be/src/tests/` (integration, e2e, contract on the test world) and the unit specs beside
   the code; a real payment is never part of a proof.

## Example
A free learner opens a locked phase: the lesson door answers `LESSON_PREMIUM_REQUIRED` (kind forbidden), no AI call is made, and the
screen shows the lock with "Xem Premium".

## Don't / Instead
- Don't open a REST route for a learner read; add a GraphQL door.
- Don't hard-code a free quota, a price or a cap; read the setting or the server-owned offer.
- Don't count a learner's day in UTC; use `Asia/Ho_Chi_Minh`.

## Where
`be/src/modules/domain/`, `be/src/features/api/`, `be/src/modules/platform/errors/`, `be/src/tests/`,
`fe/apps/app/src/modules/i18n/messages/`

Related: [premium](premium.md), [ai-teacher](ai-teacher.md), [learning-program](learning-program.md)
