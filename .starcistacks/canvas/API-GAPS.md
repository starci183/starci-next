# StarCi Next canvas: API gaps

Read from `origin/dev` of `D:/Repositories/starci-next-app` on 2026-11-17 (`be/contracts/core/schema.graphql`, `be/src/features/api/**`, `be/src/modules/domain/**`). Owner's rule: a missing API never blocks a drawing. Every item below is built when the page is coded. Names in `code` exist today; items marked **cần** do not.

## Corrections to lane reports

- **Essentials has a full lesson module (lane 02 said it had none).** Queries: `lessons(input: locale, group, topic, category, difficulty, language, provider, q)`, `lesson(input)`, `lessonTopic(input)`, `lessonProgress(input)` (phases with done/total, outcomes, simulations, attempts), `lessonAttempt`, `lessonOpenerScores` (first vs latest correct for the 5 opener questions), `lessonScenarioRuns(lessonId)`. Mutations: `submitLessonAttempt` (activityId, revision, answer; graded on the server), `saveLessonSimulation`. REST: `GET /api/lessons/:lessonId/workspace/:language/download`. `lesson.essential` already carries `isLocked`, `lockedParts`, `opener` (prompt, choices, sectionId/sectionRef/scenarioId), `source`, `architecture`, `codeWalk`, `invariants`, `scenarios` (command, guards, hint) and `challenges` (level, rubric with points and isCritical, hiddenScenarios). The lane's invented names (`essentialsCatalog`, `submitInterviewAnswer`, `lessonSource`, `lessonScenarios`, `lessonChallenges`, `retakeInterview`) are dropped from the notes.
- **Projects is already Premium-only by default (lane 03 said the default was 1).** `be/src/modules/domain/project/project.config.ts` sets `DEFAULT_FREE_PROJECTS = 0` and `DEFAULT_FREE_MILESTONES = []` (commit baef83a, 2026-11-17), and `.starciwork/concepts/premium.md` agrees. The remaining work is to make sure no deployed environment sets `PROJECT_FREE_PROJECTS` or `PROJECT_FREE_MILESTONES`, and that the UI ignores `projectCatalog.freeProjects` and `milestone.free`.
- **Real operation names.** Lanes 01 and 03 used get/list names. The notes now use the schema names: `relayDevices`, `relayPairing`, `premiumPlans`, `mcpTokens`, `projects`, `project`, `projectMilestone`, `projectRepository`, `projectCatalog`, `provedProjectConcepts`. Lane 03 also missed that `projectCvPreview` and `projectCodeRead` already exist.
- **Sign-in providers.** The backend has `facebook` and `github` only (`identity-access.service.ts`, Keycloak). The drawings show GitHub + Google.

## Needed APIs, by page

| Area | Page | Cần API | Exists today |
|------|------|---------|--------------|
| Shell/Học | learn/home | `learnerHub` returns a `harness` shard and drops `incidents`; `learnerHub.nextUp` (lesson in progress, its part, last CLI run result) | `learnerHub` (shards essentials, practice, projects, incidents, review; layer mission → /paths/choose), `streak`, `setStreakGoal`, `myPremium`, `relayDevices` |
| Auth | auth/sign-in, auth/sign-up | Google provider for `social/start` + `social/exchange` (Keycloak IdP google), **if the owner keeps Google** | REST `/api/identity` sign-in, sign-in/verify, sign-up, sign-up/verify, password-reset, password-reset/verify, challenge/resend, social/start, social/exchange, sign-out, session |
| Commerce | commerce/premium | `startPremiumCheckout` returns QR data (VietQR string, bank, account, transfer note, expiresAt) instead of only `redirect` | `premiumPlans`, `myPremium`, `startPremiumCheckout` (orderId, rail, redirect), `premiumOrder` |
| Essentials | essentials/catalog, essentials/topic | `lessons` returns the learner's 4-part progress and opener score per lesson, plus counts by state (or a batch `lessonProgress` for many lessons) | `lessons` (with `q` search), `lessonTopic`, `lessonProgress`, `lessonOpenerScores` |
| Essentials | essentials/lesson (Bản chất) | `markLessonSectionRead` (optional: clears "Nên đọc kỹ") | `lesson`, `submitLessonAttempt`, `lessonOpenerScores`, `lessonProgress` |
| Essentials | essentials/lesson-source | none | `lesson.essential.source/architecture/codeWalk`, `lesson.workspace`, workspace download, `relayManifest`, `relayDevices` |
| Essentials | essentials/lesson-scenarios | a subscription (or polling contract) that pushes `relayCheckStarted`/`relayCheckResult` to the app; a server-side hint gate (hint opens after the first red run); `requestRun` from the app (only MCP can start a run today) | `lesson.essential.scenarios`, `lessonScenarioRuns`, relay mutations from the CLI, MCP tools |
| Essentials | essentials/lesson-ladder | per-run rubric score out of 100 per criterion (`lessonScenarioRuns` has `challengeTier` but no per-criterion points); lesson "Đã chứng minh" from CI OIDC | `lesson.essential.challenges`, `RELAY_CHALLENGE_LOCKED` |
| Essentials | essentials/lesson-locked | none | `lesson.essential.isLocked`, `lockedParts`, `lesson.isPremium` |
| Projects | projects/list | `projects` returns the count of checks to re-prove and of CV lines with evidence; confirm `PROJECT_FREE_PROJECTS=0` on every environment | `projects`, `createProject` |
| Projects | projects/new | `createProject.language` as an enum of the four languages | `createProject` (language is a free string), `setProjectRepository` |
| Projects | projects/detail, projects/concept, projects/cv | check state **regressed** ("cần chứng minh lại": the latest result failed after a pass); backend has only todo, practising, proved | `project`, `updateProject`, `runProjectProbes`, `projectMilestone`, `explainProjectConcept`, `projectCodeRead` |
| Projects | projects/connect | `projectRepository` returns the first-run state and the official workflow template | `projectRepository`, `setProjectRepository`, `rotateProjectCiSecret`, webhook `POST /webhooks/project-ci` |
| Projects | projects/cv | bilingual CV lines in `projectCvPreview`; public CV link (`publicProjectCv`) | `projectCvPreview` (text, evidence, proved), `provedProjectConcepts` |
| Projects | projects/paywall | read-only flag on projects when Premium has expired | `projectCatalog`, `PROJECT_PREMIUM_REQUIRED` |
| Harness | harness/hub, harness/docs, harness/doc | `markHarnessDocRead` + `isRead` on `harnessDocs`; read counts and next doc in `harnessHub`; `searchHarnessDocs` (only if full-text search is wanted) | `harnessHub`, `harnessDocs`, `harnessDoc` |
| Harness | harness/guide | `markHarnessGuideRead` + `isRead` on `harnessGuides` | `harnessGuides`, `harnessGuide` |
| Harness | harness/build | `unbindHarnessBuild` | `harnessBuild`, `harnessBuilds`, `bindHarnessBuild` |
| Practice | practice/list | drop the practice lock (`practicePatterns.locked`, `freeCount`); `practiceNext` (next problem and the one in progress) | `practicePatterns`, `practiceReadiness` |
| Practice | practice/pattern | `practicePatternIntro` ("Khi nào dùng") | `practiceProblems` |
| Practice | practice/problem | `revealPracticeSolution` (returns the model solution and records it, so the problem no longer counts toward experience) | `practiceProblem`, `runPractice`, `submitPractice`, `practiceSubmission`, `revealPracticeHint` |
| Review | review/hub | drop `reviewToday.lockedCount` (Ôn tập is free) | `reviewToday`, `reviewStats`, `setReviewGoal`, `reviewDecks` |
| Review | review/deck (new) | `reviewDeck(deckId)` with sample cards (questions only) and the deck's own progress | `reviewDecks`, `addReviewDeck`, `removeReviewDeck` |
| Review | review/session | none | `reviewQueue`, `reviewItem`, `submitReviewRetrieval`, `flipReviewCard`, `checkReviewCloze`, `gradeReviewCard` |
| Profile | profile/overview | combined CV link `next.starci.vn/cv/{slug}` (`cvLink`, `setCvVisibility`) | `myProfile`, `setProfileName`, `requestAvatarUpload`, `confirmAvatarUpload`, `removeAvatar`, `myExperience`, `showExperience`, `verifyExperience` |
| Profile | career/experience | `assignExperience` accepts part `practice`, **only if the owner says Practice counts** | `myExperience`, `submitExperience`, `showExperience`, `revokeExperience` |
| Profile | progress/overview | `learnerProgress.practice` (Accepted count, total, progress per pattern) | `learnerProgress` |
| Devices | devices/list | none | `relayDevices`, `relayPairing`, `confirmRelayDevice`, `revokeRelayDevice`, `mcpConnectInfo`, `mcpTokens`, `createMcpToken`, `revokeMcpToken` |

## Backend items to retire with the drawings

- `learnerHub` shard `incidents` and the `incidents` query, plus `outcomePaths`/`chooseOutcomePath` (layer mission → /paths/choose). The drawings drop them; see QUESTIONS.md #10 before removing.
- The `payos` rail stays in the backend, but the UI only offers SePay (QUESTIONS.md #6).
