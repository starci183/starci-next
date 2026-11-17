import {
    DEFAULT_CONCURRENCY,
    DEFAULT_MAX_SOURCE_BYTES,
    DEFAULT_SUBMISSIONS_PER_MINUTE,
    DEFAULT_WAIT_MS,
    type PracticeSettings,
} from "./practice.config"
import type { PracticeOptions } from "./practice.options"

/** The settings of the capability with a default for every one the app left out. */
export const settingsOf = (options: PracticeOptions): PracticeSettings => ({
    concurrency: options.concurrency ?? DEFAULT_CONCURRENCY,
    submissionsPerMinute: options.submissionsPerMinute ?? DEFAULT_SUBMISSIONS_PER_MINUTE,
    maxSourceBytes: options.maxSourceBytes ?? DEFAULT_MAX_SOURCE_BYTES,
    waitMs: options.waitMs ?? DEFAULT_WAIT_MS,
})
