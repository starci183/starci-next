import type { EnvSource } from "@modules/platform/config"
import type { ProjectOptions } from "./project.options"

/** Projects a learner without Premium may own unless the environment names another number: none, Projects is subscription-only. */
export const DEFAULT_FREE_PROJECTS = 0

/** The milestones a learner without Premium may open: none, Projects is subscription-only. */
export const DEFAULT_FREE_MILESTONES: ReadonlyArray<string> = []

/** Probe runs one project may start per hour. */
export const DEFAULT_PROBE_RUNS_PER_HOUR = 6

/** AI code reads one learner may start per UTC day. */
export const DEFAULT_CODE_READS_PER_DAY = 20

/** Milliseconds one probe request may take. */
export const DEFAULT_PROBE_TIMEOUT_MS = 6000

/** Bytes of a probe response StarCi reads. */
export const DEFAULT_PROBE_MAX_BYTES = 65_536

/** Parallel requests of the last-item probe. */
export const DEFAULT_PROBE_PARALLEL = 10

/** Milliseconds a CI delivery's timestamp may differ from now. */
export const DEFAULT_CI_TOLERANCE_MS = 600_000

/** Milliseconds the AI teacher has for one code read. */
export const DEFAULT_CODE_READ_TIMEOUT_MS = 60_000

/** The settings of the project capability the environment tunes. */
export type ProjectEnvSettings = Pick<ProjectOptions, "checksDir" | "probeSinkBaseUrl" | "ciOidcAudience"> &
    Required<
        Pick<
            ProjectOptions,
            | "freeProjects"
            | "freeMilestones"
            | "probeRunsPerHour"
            | "codeReadsPerDay"
            | "probeTimeoutMs"
            | "probeMaxBytes"
            | "probeParallel"
            | "ciToleranceMs"
            | "codeReadTimeoutMs"
        >
    >

/**
 * Reads the project settings from an environment source: `PROJECT_FREE_PROJECTS`, `PROJECT_FREE_MILESTONES` (comma-separated ids; `0` or empty means none),
 * `PROJECT_PROBE_RUNS_PER_HOUR`, `PROJECT_CODE_READS_PER_DAY`, `PROJECT_PROBE_TIMEOUT`, `PROJECT_PROBE_MAX_BYTES`,
 * `PROJECT_PROBE_PARALLEL`, `PROJECT_CI_TOLERANCE` and `PROJECT_CODE_READ_TIMEOUT`, all with defaults; the audience GitHub run tokens must name (`PROJECT_CI_OIDC_AUDIENCE`, default `starci-next`, optional); and where the check set and
 * the probe sink live: `PROJECT_CHECKS_DIR`, `PROJECT_PROBE_SINK_URL`, each optional.
 */
export const parseProjectConfig = (env: EnvSource): ProjectEnvSettings => ({
    freeProjects: env.int("PROJECT_FREE_PROJECTS", DEFAULT_FREE_PROJECTS),
    freeMilestones:
        env
            .optional("PROJECT_FREE_MILESTONES")
            ?.split(",")
            .map((id) => id.trim())
            .filter((id) => id !== "" && id !== "0") ?? DEFAULT_FREE_MILESTONES,
    probeRunsPerHour: env.int("PROJECT_PROBE_RUNS_PER_HOUR", DEFAULT_PROBE_RUNS_PER_HOUR),
    codeReadsPerDay: env.int("PROJECT_CODE_READS_PER_DAY", DEFAULT_CODE_READS_PER_DAY),
    probeTimeoutMs: env.duration("PROJECT_PROBE_TIMEOUT", DEFAULT_PROBE_TIMEOUT_MS),
    probeMaxBytes: env.int("PROJECT_PROBE_MAX_BYTES", DEFAULT_PROBE_MAX_BYTES),
    probeParallel: Math.max(1, env.int("PROJECT_PROBE_PARALLEL", DEFAULT_PROBE_PARALLEL)),
    ciToleranceMs: env.duration("PROJECT_CI_TOLERANCE", DEFAULT_CI_TOLERANCE_MS),
    codeReadTimeoutMs: env.duration("PROJECT_CODE_READ_TIMEOUT", DEFAULT_CODE_READ_TIMEOUT_MS),
    ...optionalOf("ciOidcAudience", env.optional("PROJECT_CI_OIDC_AUDIENCE")),
    ...optionalOf("checksDir", env.optional("PROJECT_CHECKS_DIR")),
    ...optionalOf("probeSinkBaseUrl", env.optional("PROJECT_PROBE_SINK_URL")?.replace(/\/$/u, "")),
})

const optionalOf = <K extends string>(key: K, value: string | undefined): Partial<Record<K, string>> =>
    value === undefined || value === "" ? {} : ({ [key]: value } as Partial<Record<K, string>>)
