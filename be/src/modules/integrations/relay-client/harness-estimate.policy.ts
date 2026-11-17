import type { Trap } from "./harness-trial.contracts"

/** The tokens of a system prompt and tool definitions the agent carries on every turn. */
const OVERHEAD_TOKENS = 4_000

/** The characters per token the estimate assumes. */
const CHARS_PER_TOKEN = 4

/** The output tokens one turn writes, on average. */
const OUTPUT_PER_TURN = 600

/** The turns the estimate assumes at most; the trap's `maxTurns` is a limit, not an average. */
const TURNS_ASSUMED_MAX = 20

/** What a trial is expected to cost, in tokens, and the assumptions behind it. */
export interface TrialEstimate {
    /** The input tokens read over the whole run (most of them cached by the tool). */
    readonly inputTokens: number
    /** The output tokens written. */
    readonly outputTokens: number
    /** The turns assumed. */
    readonly turns: number
}

/**
 * A rough cost of one trial: the context (repo, config, prompt, tool overhead) is read again every turn, and each turn writes a few
 * hundred tokens. It is a guide to the order of magnitude, never a promise; the trap's budget is the real ceiling.
 */
export const estimateOf = (trap: Trap, repoBytes: number, configBytes: number): TrialEstimate => {
    const turns = Math.min(trap.budget.maxTurns, TURNS_ASSUMED_MAX)
    const context = Math.ceil((repoBytes + configBytes + trap.prompt.length) / CHARS_PER_TOKEN) + OVERHEAD_TOKENS
    return { inputTokens: context * turns, outputTokens: OUTPUT_PER_TURN * turns, turns }
}

/** A count of tokens as the learner reads it: `48k`, `1.2M`. */
export const tokensText = (tokens: number): string => {
    if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`
    if (tokens >= 1_000) return `${Math.round(tokens / 1_000)}k`
    return String(tokens)
}
