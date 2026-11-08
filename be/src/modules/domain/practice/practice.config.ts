import type { EnvSource } from "@modules/platform/config"
import type { PracticeOptions } from "./practice.options"

/** The problems of each pattern a learner without Premium may open unless the environment names another number. */
export const DEFAULT_FREE_PER_PATTERN = 1

/** The submissions judged at the same time on one instance unless the environment names another number. */
export const DEFAULT_CONCURRENCY = 4

/** The submissions one learner may send per minute unless the environment names another number. */
export const DEFAULT_SUBMISSIONS_PER_MINUTE = 10

/** The largest source a submission may carry, in bytes. */
export const DEFAULT_MAX_SOURCE_BYTES = 65_536

/** How long a run or submit waits for its verdict before it answers a submission still running. */
export const DEFAULT_WAIT_MS = 25_000

/** The settings of the practice capability the environment tunes. */
export type PracticeSettings = Required<
    Pick<PracticeOptions, "freePerPattern" | "concurrency" | "submissionsPerMinute" | "maxSourceBytes" | "waitMs">
>

/**
 * Reads the practice settings from an environment source: `PRACTICE_FREE_PER_PATTERN`, `PRACTICE_JUDGE_CONCURRENCY`,
 * `PRACTICE_SUBMISSIONS_PER_MINUTE`, `PRACTICE_MAX_SOURCE_BYTES` and `PRACTICE_WAIT`. All have defaults (1, 4, 10, 65536, 25 s).
 */
export const parsePracticeConfig = (env: EnvSource): PracticeSettings => ({
    freePerPattern: env.int("PRACTICE_FREE_PER_PATTERN", DEFAULT_FREE_PER_PATTERN),
    concurrency: Math.max(1, env.int("PRACTICE_JUDGE_CONCURRENCY", DEFAULT_CONCURRENCY)),
    submissionsPerMinute: env.int("PRACTICE_SUBMISSIONS_PER_MINUTE", DEFAULT_SUBMISSIONS_PER_MINUTE),
    maxSourceBytes: env.int("PRACTICE_MAX_SOURCE_BYTES", DEFAULT_MAX_SOURCE_BYTES),
    waitMs: env.duration("PRACTICE_WAIT", DEFAULT_WAIT_MS),
})
