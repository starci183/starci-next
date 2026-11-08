import type { EnvSource } from "@modules/platform/config"
import type { AttemptOptions } from "./attempt.options"

/** The most gradings by the coach one learner gets per UTC day unless the environment names another number. */
export const DEFAULT_DAILY_GRADING_LIMIT = 100

/**
 * Reads the fair-use limit of the attempt capability from an environment source: `ATTEMPT_COACH_DAILY_LIMIT`, a whole number of
 * coach gradings per learner per UTC day, default 100. A limit of 0 turns the AI gradings off for everyone.
 */
export const parseAttemptConfig = (env: EnvSource): Required<Pick<AttemptOptions, "dailyGradingLimit">> => ({
    dailyGradingLimit: env.int("ATTEMPT_COACH_DAILY_LIMIT", DEFAULT_DAILY_GRADING_LIMIT),
})
