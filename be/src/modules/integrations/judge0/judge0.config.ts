import type { EnvSource } from "@modules/platform/config"
import { Judge0Error, Judge0ErrorCode } from "./errors/judge0.error"
import type { Judge0Options } from "./judge0.options"

/** How long one call to Judge0 may take unless the deployment says otherwise. */
const DEFAULT_TIMEOUT_MS = 10_000

/** The wait between two reads of a batch that is still judging. */
const DEFAULT_POLL_INTERVAL_MS = 500

/** How long a whole batch may take unless the deployment says otherwise. */
const DEFAULT_DEADLINE_MS = 60_000

/** The environment keys that declare the Judge0 endpoint: their presence is what makes the judge declared. */
const JUDGE0_KEYS: ReadonlyArray<string> = ["JUDGE0_BASE_URL", "JUDGE0_AUTH_TOKEN", "JUDGE0_AUTH_TOKEN_FILE"]

const withoutTrailingSlash = (origin: string): string => (origin.endsWith("/") ? origin.slice(0, -1) : origin)

const positive = (env: EnvSource, key: string, fallback: number): number => {
    const value = env.duration(key, fallback)
    if (value <= 0) throw new Judge0Error({ code: Judge0ErrorCode.ConfigInvalid, params: { key } })
    return value
}

/**
 * Reads the Judge0 endpoint of an environment source. No declared key answers `null` (this instance runs no code); a declared
 * key makes the base URL and the auth token required, the token as a `Secret` (its `_FILE` companion works). The deadlines are
 * non-secret settings with defaults.
 */
export const parseJudge0Config = (env: EnvSource): Judge0Options | null =>
    env.anyDeclared(JUDGE0_KEYS)
        ? {
              baseUrl: withoutTrailingSlash(env.url("JUDGE0_BASE_URL")),
              authToken: env.secret("JUDGE0_AUTH_TOKEN"),
              timeoutMs: positive(env, "JUDGE0_TIMEOUT", DEFAULT_TIMEOUT_MS),
              pollIntervalMs: positive(env, "JUDGE0_POLL_INTERVAL", DEFAULT_POLL_INTERVAL_MS),
              deadlineMs: positive(env, "JUDGE0_DEADLINE", DEFAULT_DEADLINE_MS),
          }
        : null
