import type { EnvSource } from "@modules/platform/config"
import type { PracticeOptions } from "./practice.options"

/** The submissions judged at the same time on one instance unless the environment names another number. */
export const DEFAULT_CONCURRENCY = 4

/** The submissions one learner may send per minute unless the environment names another number. */
export const DEFAULT_SUBMISSIONS_PER_MINUTE = 10

/** The largest source a submission may carry, in bytes. */
export const DEFAULT_MAX_SOURCE_BYTES = 65_536

/** How long a run or submit waits for its verdict before it answers a submission still running. */
export const DEFAULT_WAIT_MS = 25_000

/** The submissions a page of the learner history holds unless the environment names another number. */
export const DEFAULT_SUBMISSIONS_PAGE = 20

/** The most submissions a page of the learner history may hold; the input bound of the limit is the same number. */
export const SUBMISSIONS_PAGE_MAX = 50

/** The settings of the practice capability the environment tunes. */
export type PracticeSettings = Required<
    Pick<PracticeOptions, "concurrency" | "submissionsPerMinute" | "maxSourceBytes" | "waitMs" | "submissionsPage">
>

/**
 * Reads the practice settings from an environment source: `PRACTICE_JUDGE_CONCURRENCY`, `PRACTICE_SUBMISSIONS_PER_MINUTE`,
 * `PRACTICE_MAX_SOURCE_BYTES`, `PRACTICE_WAIT` and `PRACTICE_SUBMISSIONS_PAGE`. All have defaults (4, 10, 65536, 25 s, 20).
 */
export const parsePracticeConfig = (env: EnvSource): PracticeSettings => ({
    concurrency: Math.max(1, env.int("PRACTICE_JUDGE_CONCURRENCY", DEFAULT_CONCURRENCY)),
    submissionsPerMinute: env.int("PRACTICE_SUBMISSIONS_PER_MINUTE", DEFAULT_SUBMISSIONS_PER_MINUTE),
    maxSourceBytes: env.int("PRACTICE_MAX_SOURCE_BYTES", DEFAULT_MAX_SOURCE_BYTES),
    waitMs: env.duration("PRACTICE_WAIT", DEFAULT_WAIT_MS),
    submissionsPage: Math.min(
        SUBMISSIONS_PAGE_MAX,
        Math.max(1, env.int("PRACTICE_SUBMISSIONS_PAGE", DEFAULT_SUBMISSIONS_PAGE)),
    ),
})
