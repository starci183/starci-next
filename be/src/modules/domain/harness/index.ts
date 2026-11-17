/**
 * The harness capability: the standalone /harness area with three parts (Build, Use, Docs), free for everyone.
 *
 * - `convertRawHarness(files)`: the pure converter of `raw/harness/**` to records, shared by the importer and the seed adapter.
 * - `HarnessImportService.import({ directory, ref })`: stores the converted tree as immutable versions (the content sync kind `harness`).
 * - `HarnessReadService`: the hub, builds with stage state, guides, docs, doctor, trial and the packs the relay serves.
 * - `HarnessProofService` binds a build to the learner GitHub repository (no Project, no Premium); `HarnessCiService` takes the
 *   attested CI runs of that repository as proof, and a proved build reaches the career producer as `harness.build-proved`.
 *
 * Relayed results are practice and live in the relay; this capability never asks the entitlement question.
 */
export { HARNESS_ERROR_KINDS, HarnessError, HarnessErrorCode } from "./errors/harness.error"
export { HARNESS_MESSAGES } from "./messages/harness.messages"
export { harnessEntities, harnessMigrations } from "./persistence/connection"
export { convertRawHarness, hasRawHarness } from "./harness-raw.policy"
export {
    HARNESS_BUILD_TASK_PREFIX,
    HARNESS_DOCTOR_TASK,
    HARNESS_SLOTS,
    HARNESS_TRIAL_TASK,
    harnessBuildTaskOf,
} from "./harness-progress.policy"
export type { StoredBuild, StoredTrap } from "./harness-progress.policy"
export { HARNESS_LOCALES, HARNESS_PART_KEYS, HARNESS_TOOLS } from "./harness.contracts"
export type {
    HarnessBuildSummaryView,
    HarnessBuildView,
    HarnessConverted,
    HarnessDocSummaryView,
    HarnessDocView,
    HarnessPageView,
    HarnessDoctorView,
    HarnessE2eView,
    HarnessGuideSummaryView,
    HarnessGuideView,
    HarnessHubView,
    HarnessImportReport,
    HarnessKeyNeedView,
    HarnessLocale,
    HarnessPartKey,
    HarnessPartView,
    HarnessProbeResultView,
    HarnessProbeStatus,
    HarnessProofRow,
    HarnessProofState,
    HarnessRawFile,
    HarnessRepositoryView,
    HarnessRunRow,
    HarnessShortcutView,
    HarnessStageView,
    HarnessTextView,
    HarnessTool,
    HarnessTrapView,
    HarnessTrialResultView,
} from "./harness.contracts"
export type { HarnessPack } from "./harness-read.service"
export { HarnessModule } from "./harness.module"
export { HarnessImportService } from "./harness-import.service"
export { HarnessProofService } from "./harness-proof.service"
export type { HarnessBindingView } from "./harness-proof.service"
export { HarnessCiService } from "./harness-ci.service"
export type { HarnessCiDelivery } from "./harness-ci.policy"
export type { HarnessCiReceipt } from "./harness-ci.service"
export { HarnessReadService } from "./harness-read.service"
export { HarnessLogEvent } from "./harness.log-events"
export {
    HarnessBuildsSeedSet,
    HarnessDocsSeedSet,
    HarnessDoctorPacksSeedSet,
    HarnessGuidesSeedSet,
    HarnessProbesSeedSet,
    HarnessTrapsSeedSet,
} from "./harness-seed.set"
