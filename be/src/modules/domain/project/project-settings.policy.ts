import {
    DEFAULT_CI_TOLERANCE_MS,
    DEFAULT_CODE_READ_TIMEOUT_MS,
    DEFAULT_CODE_READS_PER_DAY,
    DEFAULT_FREE_MILESTONES,
    DEFAULT_FREE_PROJECTS,
    DEFAULT_PROBE_MAX_BYTES,
    DEFAULT_PROBE_PARALLEL,
    DEFAULT_PROBE_RUNS_PER_HOUR,
    DEFAULT_PROBE_TIMEOUT_MS,
} from "./project.config"
import type { ProjectSettings } from "./project.contracts"
import type { ProjectOptions } from "./project.options"

/** The settings of the capability: the app's options over the proposed defaults, each configurable. */
export const projectSettingsOf = (options: ProjectOptions): ProjectSettings => ({
    freeProjects: options.freeProjects ?? DEFAULT_FREE_PROJECTS,
    freeMilestones: options.freeMilestones ?? DEFAULT_FREE_MILESTONES,
    probeRunsPerHour: options.probeRunsPerHour ?? DEFAULT_PROBE_RUNS_PER_HOUR,
    codeReadsPerDay: options.codeReadsPerDay ?? DEFAULT_CODE_READS_PER_DAY,
    probeTimeoutMs: options.probeTimeoutMs ?? DEFAULT_PROBE_TIMEOUT_MS,
    probeMaxBytes: options.probeMaxBytes ?? DEFAULT_PROBE_MAX_BYTES,
    probeParallel: options.probeParallel ?? DEFAULT_PROBE_PARALLEL,
    ciToleranceMs: options.ciToleranceMs ?? DEFAULT_CI_TOLERANCE_MS,
    codeReadTimeoutMs: options.codeReadTimeoutMs ?? DEFAULT_CODE_READ_TIMEOUT_MS,
})
