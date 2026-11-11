/**
 * The project capability (the Projects shard, decision.projects.model).
 *
 * A learner owns many projects of any topic, language and structure, of kind `app` or `agent`; StarCi Shop is the sample for learners
 * without an idea. A milestone is a list of concepts taken from Essentials lessons (`project-catalog.policy.ts`), and a concept needs
 * evidence: the learner's tagged tests (`[concept]` in the test name), e2e flows (`starci/e2e/<concept>.md`), the generic StarCi probes
 * the learner cannot edit, and the AI teacher reading the code the learner points to. Behaviour concepts need a test or e2e flow and the
 * probes; structure concepts need the AI code read; a concept whose lesson is not written yet shows being written by the teacher.
 *
 * Practice versus proof: results from the learner machine arrive through `ProjectRelayPort` (the app binds the relay's `RelayProjectService`;
 * `NoRelayClient` is the default) and are practice only, like a CI run GitHub did not attest (`ci-signed`). Proof comes from an attested CI run
 * (`ProjectCiService.recordRun`, behind the webhook door `POST /webhooks/project-ci`: HMAC-SHA256 with a per-project secret is the
 * transport check, and the run's GitHub Actions OIDC token in `x-starci-oidc`, checked through `CiAttestationVerifier` against the
 * repository bound with `ProjectRepositoryService.set`, makes it attested; `UnattestedCiClient` until the GitHub OIDC integration is
 * composed, decision Q-PJ-1), from the server probe runner (`ProjectProbeService`, public
 * http or https targets only) or from the AI teacher's read (`ProjectCodeReadService`, graded with the rubric of the matching lesson).
 *
 * A concept proved for the first time is claimed once: it reaches the Essentials experience line, a proved milestone and a probed
 * deployment reach the experience producer of the career capability (CV lines come from the Projects shard), a notification, and each run counts as
 * one `projects` / `project-run` streak action.
 *
 * Relay port (`ProjectRelayPort`, `project-relay.port.ts`): `checkResults({ learnerId, projectId, after })` answers the `check.result`
 * events of contract.relay.channel as `RelayCheckResult` (`eventId`, `runId`, `conceptId`, `slot` test, e2e or probe, `ref`, `passed`,
 * `commit`, `at`); the app binds it with `ProjectModule.register({ relay })`, `NoRelayClient` until the relay is built. Results are
 * practice only and each `eventId` counts once. `ProjectReadService.provedConcepts` is the read a path engine counts once per concept.
 */
export { PROJECT_ERROR_KINDS } from "./errors/project.error"
export { PROJECT_MESSAGES } from "./messages/project.messages"
export { AiProjectCoachClient } from "./ai-project-coach.client"
export { LessonCatalogClient } from "./lesson-catalog.client"
export { milestoneOf } from "./project-catalog.policy"
export { parseProjectConfig } from "./project.config"
export { ProjectCiService } from "./project-ci.service"
export { ProjectCodeReadService } from "./project-code-read.service"
export { ProjectModule } from "./project.module"
export { ProjectPracticeService } from "./project-practice.service"
export { ProjectProbeService } from "./project-probe.service"
export { ProjectReadService } from "./project-read.service"
export { ProjectRepositoryService } from "./project-repository.service"
export { ProjectService } from "./project.service"
export { projectEntities, projectMigrations } from "./persistence/connection"
export type { ProjectRelayPort } from "./project-relay.port"
export type { CiAttestationVerifier } from "./project-ci-attestation.port"
export type { CiAttestation, CiAttestationRequest, ProjectRepositoryView } from "./project-params.contracts"
export type {
    ConceptView,
    MilestoneView,
    ProbeRunView,
    ProjectCatalogView,
    ProjectDeletedView,
    ProjectSecretView,
    ProjectSummaryView,
    ProjectView,
    ProvedConceptView,
} from "./project-view.contracts"
export type { RelayResultsRequest } from "./project-params.contracts"
export type { ProjectKind, ProjectLocale, RelayCheckResult } from "./project.contracts"
