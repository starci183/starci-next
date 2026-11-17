# Concepts

StarCi Next's persistent shared context: its terms, rules and product rulings, and the folders that hold them. Read this table first,
then [conventions](conventions.md) and the concept of every folder you are about to touch, before you read code. When that context
changes, edit the concept to the current truth. History, decisions in progress and status do not live here; a request, a note or code
that contradicts a concept is put to the owner with the concept's name, never applied silently.

StarCi Next is a learning program: parts that each grant verified, CV-worthy experience, one Premium subscription that unlocks all of it
with the AI teacher, and content pulled from git that the teacher owns.

| Concept | Read when you touch (folders) | One line |
| --- | --- | --- |
| [conventions](conventions.md) | every folder | Names of capabilities, tables, keys, error codes, doors, days and locales; how behaviour is proved. |
| [learning-program](learning-program.md) | `be/src/modules/domain/hub/`, `be/src/modules/domain/path/`, `be/src/modules/domain/agent-lab/`, `fe/apps/app/src/app/` | The parts, the hub's eleven entries, outcome paths, the agent curriculum, build order. |
| [premium](premium.md) | `be/src/modules/domain/purchase/`, `be/src/modules/domain/entitlement/`, `be/src/modules/integrations/sepay/`, `be/src/modules/integrations/payos/`, `be/src/features/api/commerce/` | One subscription unlocks everything; the free tier of each part; how a payment grants, extends and revokes; the dev-only grant. |
| [ai-teacher](ai-teacher.md) | `be/src/modules/integrations/ai-gateway/`, `be/src/modules/domain/attempt/` | One model, grading only against the teacher's rubric with quoted evidence, the fair-use cap, privacy. |
| [content](content.md) | `be/src/modules/domain/content/`, `be/src/features/cli/` | Content lives in git outside the app, pulled into versioned snapshots; the teacher's text is never paraphrased. |
| [essentials](essentials.md) | `be/src/modules/domain/lesson/`, `be/src/modules/domain/attempt/`, `be/src/modules/domain/incident/`, `fe/apps/app/src/app/[locale]/(app)/essentials/` | Bản chất: lesson format, six phases, learning rules, the category tree, understood and proved levels, incidents. |
| [review](review.md) | `be/src/modules/domain/review/`, `fe/apps/app/src/app/[locale]/(app)/review/` | Ôn tập: one daily queue, recall before the answer, the fixed ladder and the authored retrieval days. |
| [streak](streak.md) | `be/src/modules/domain/streak/`, `be/src/modules/domain/hub/` | One app-wide streak counted on real work only; freezes and the weekly goal; never experience. |
| [mock-interview](mock-interview.md) | `be/src/modules/domain/interview/`, `fe/apps/app/src/app/[locale]/(app)/interview/` | Phỏng vấn thử: no answer given away, every word saved first, the whole session graded once by the teacher's bank. |
| [practice](practice.md) | `be/src/modules/domain/practice/`, `be/src/modules/integrations/judge0/` | Luyện code: the teacher's problems on a queued Judge0; hidden tests stay hidden; the AI never writes code. |
| [projects](projects.md) | `be/src/modules/domain/project/`, `fe/apps/app/src/app/[locale]/(app)/projects/` | Dự án: the learner's own projects, concept milestones, four evidence slots, practising versus proved. |
| [learner-cli-relay](learner-cli-relay.md) | `be/apps/relay-cli/`, `be/apps/core/`, `be/src/modules/domain/relay/`, `be/src/modules/integrations/relay-client/`, `be/src/features/cli/` | Code runs on the learner's machine through relay-cli and the relay in core; proof needs GitHub attestation or a server rerun. |
| [mcp](mcp.md) | `be/src/modules/domain/mcp/`, `be/src/features/api/mcp/`, `fe/apps/app/src/components/blocks/ConnectAi/` | The learner's own Claude or ChatGPT reads the unlocked lesson and source, sees their runs and asks their machine to re-run a scenario; hidden tests, rubrics and answer keys never leave. |
| [verified-experience](verified-experience.md) | `be/src/modules/domain/career/`, `fe/apps/app/src/app/[locale]/(app)/experience/`, `fe/apps/app/src/app/[locale]/(app)/review-queue/` | The AI grades, the teacher signs each item; only verified items count; reviewers, revoke, audit, hiring bridge. |
| [profile-progress](profile-progress.md) | `be/src/modules/domain/profile/`, `be/src/modules/domain/progress/`, `fe/apps/app/src/components/blocks/ProfileHub/`, `fe/apps/app/src/components/blocks/ProgressOverview/` | The profile (name, avatar, verified CV lines, account panels, public verify links) and the one progress read model across the app; nothing stored twice. |
| [identity](identity.md) | `be/src/modules/domain/identity/`, `be/src/modules/integrations/keycloak/`, `be/src/features/api/identity/` | Keycloak hidden behind the backend: password plus mailed code, Facebook and GitHub, roles only from verified claims. |
| [app-shell](app-shell.md) | `fe/apps/app/src/features/layouts/`, `fe/apps/app/src/components/blocks/AppHeader/`, `fe/apps/app/src/components/blocks/AppSidebar/` | The shell mirrors the NIVO console; the plan in the lockup line and the avatar menu; no sidebar footer. |
| [theme-and-type](theme-and-type.md) | `fe/apps/app/src/app/`, `fe/apps/app/src/modules/brand/`, `fe/apps/landing/src/modules/brand/` | The white theme with the violet accent as a signal, neutrals with no hue, one font, UI text 14 and 12 only, dark only from tokens. |
| [surface-layering](surface-layering.md) | `fe/apps/app/src/components/blocks/`, `fe/packages/starci-next-ui/` | White flat chrome and surface; a card only for a real object; button, icon and link laws. |
| [gallery](gallery.md) | `gallery/pages/`, `scripts/` | Every screen has a gallery folder with three widths and an explain.md, and is compared with its drawing before it is done. |
