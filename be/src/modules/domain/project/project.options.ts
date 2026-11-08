import type { Type } from "@nestjs/common"
import type { CiAttestationVerifier } from "./project-ci-attestation.port"
import type { ProjectCoach } from "./project-coach.port"
import type { ProjectLessonPort } from "./project-lesson.port"
import type { ProjectRelayPort } from "./project-relay.port"

/** Options of the project capability; every setting falls back to its default. */
export interface ProjectOptions {
    /** Whether this capability is available app-wide. */
    readonly isGlobal?: boolean
    /** The relay port that reads check results from the learner machine; absent, `NoRelayClient`, which reads none (the relay is not built yet). */
    readonly relay?: Type<ProjectRelayPort>
    /** The AI teacher that reads code; absent, `UnconfiguredProjectCoach`, which grades nothing. */
    readonly coach?: Type<ProjectCoach>
    /** The Essentials lessons behind the concepts; absent, `LessonCatalogClient` over the lesson capability. */
    readonly lessons?: Type<ProjectLessonPort>
    /** The GitHub attestation of CI runs; absent, `UnattestedCiClient`, which attests nothing, so every run stays signed-only practice. */
    readonly attestation?: Type<CiAttestationVerifier>
    /** The audience a run's GitHub Actions OIDC token must name; absent, `starci-next`. */
    readonly ciOidcAudience?: string
    /** Projects a learner without Premium may own; absent, 1. */
    readonly freeProjects?: number
    /** Milestone ids a learner without Premium may open; absent, the first milestone, `bf-http-foundation`. */
    readonly freeMilestones?: ReadonlyArray<string>
    /** Probe runs one project may start per hour; absent, 6. */
    readonly probeRunsPerHour?: number
    /** AI code reads one learner may start per UTC day; absent, 20. */
    readonly codeReadsPerDay?: number
    /** Milliseconds one probe request may take; absent, 6000. */
    readonly probeTimeoutMs?: number
    /** Bytes of a probe response StarCi reads; absent, 65536. */
    readonly probeMaxBytes?: number
    /** Parallel requests of the last-item probe; absent, 10. */
    readonly probeParallel?: number
    /** Milliseconds a CI delivery's timestamp may differ from now; absent, 600000. */
    readonly ciToleranceMs?: number
    /** Milliseconds the AI teacher has for one code read; absent, 60000. */
    readonly codeReadTimeoutMs?: number
}
