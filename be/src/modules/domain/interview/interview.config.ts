import type { EnvSource } from "@modules/platform/config"
import type { InterviewSettings } from "./interview.options"
import { DEFAULT_SCORING_RULES } from "./scoring.policy"
import type { PoolMode } from "./track.policy"

/** The settings every deployment gets unless its environment names others. */
export const DEFAULT_INTERVIEW_SETTINGS: InterviewSettings = {
    freeSessionsPerMonth: 1,
    freeLength: 3,
    premiumLength: 5,
    dailyAiLimit: 150,
    idleMinutes: 60,
    pool: "mvp",
    scoring: DEFAULT_SCORING_RULES,
}

/**
 * Reads the interview settings of an environment source: `INTERVIEW_FREE_SESSIONS_PER_MONTH`, `INTERVIEW_FREE_LENGTH`,
 * `INTERVIEW_PREMIUM_LENGTH`, `INTERVIEW_AI_DAILY_LIMIT` (a limit of 0 turns the AI steps off for everyone),
 * `INTERVIEW_IDLE_MINUTES`, `INTERVIEW_POOL` (`mvp` or `widened`), `INTERVIEW_HINT_PENALTY`, `INTERVIEW_OWNERSHIP_DEDUCTION`,
 * `INTERVIEW_PASS_SCORE` and `INTERVIEW_BORDERLINE_SCORE`.
 */
export const parseInterviewConfig = (env: EnvSource): InterviewSettings => {
    const pool: PoolMode = env.optional("INTERVIEW_POOL") === "widened" ? "widened" : "mvp"
    const defaults = DEFAULT_INTERVIEW_SETTINGS
    return {
        freeSessionsPerMonth: env.int("INTERVIEW_FREE_SESSIONS_PER_MONTH", defaults.freeSessionsPerMonth),
        freeLength: env.int("INTERVIEW_FREE_LENGTH", defaults.freeLength),
        premiumLength: env.int("INTERVIEW_PREMIUM_LENGTH", defaults.premiumLength),
        dailyAiLimit: env.int("INTERVIEW_AI_DAILY_LIMIT", defaults.dailyAiLimit),
        idleMinutes: env.int("INTERVIEW_IDLE_MINUTES", defaults.idleMinutes),
        pool,
        scoring: {
            hintPenalty: env.int("INTERVIEW_HINT_PENALTY", defaults.scoring.hintPenalty),
            ownershipDeduction: env.int("INTERVIEW_OWNERSHIP_DEDUCTION", defaults.scoring.ownershipDeduction),
            passScore: env.int("INTERVIEW_PASS_SCORE", defaults.scoring.passScore),
            borderlineScore: env.int("INTERVIEW_BORDERLINE_SCORE", defaults.scoring.borderlineScore),
        },
    }
}
