import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { StreakOptions } from "./streak.options"

/** Injection token of the options of the streak capability. */
export const STREAK_OPTIONS: unique symbol = Symbol("domain.streak.options")

/** Injects the options of the streak capability. Parameter type: StreakOptions. */
export const InjectStreakOptions = (): TypedParameterDecorator<StreakOptions> => injector<StreakOptions>(STREAK_OPTIONS)
