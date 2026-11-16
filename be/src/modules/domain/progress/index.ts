/**
 * The progress capability: how far a learner has come across the whole app, on one page.
 *
 * - `ProgressService.read(learnerId, locale)`: the ribbon (proved concepts, streak, lessons done, builds done), Essentials (topics,
 *   lessons, the opener before and after, the parts the plan opens), the harness (builds, stages, doctor and trial verdicts),
 *   Projects (concepts proved or practising, milestones; a subscriber only), Review (due cards and the streak) and a recent-activity
 *   timeline.
 *
 * It stores nothing and owns no table: every number is read from the capability that owns it. A source that fails is logged and
 * listed in `unavailable`, and the page still answers. The harness is read through `ProgressHarnessPort`; until the harness
 * capability is composed the app binds the sample read `ProgressHarnessFixtureClient`, which marks its answer `fixture`.
 */
export type { LearnerProgressView, ProgressLocale } from "./progress.contracts"
export { ProgressModule } from "./progress.module"
export { ProgressService } from "./progress.service"
