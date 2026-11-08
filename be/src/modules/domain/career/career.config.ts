import type { EnvSource } from "@modules/platform/config"
import type { CareerOptions } from "./career.options"

/**
 * Reads the career settings an environment declares: `CAREER_DEV_SEED`, `true` only in the development stack, lets the cli seed
 * sample experience items; every other environment leaves it undeclared, so the seed is refused there.
 */
export const parseCareerConfig = (env: EnvSource): Required<Pick<CareerOptions, "devSeed">> => ({
    devSeed: env.bool("CAREER_DEV_SEED", false),
})
