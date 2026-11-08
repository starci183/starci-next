import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { AttemptOptions } from "./attempt.options"

/** Injection token of the options of the attempt capability. */
export const ATTEMPT_OPTIONS: unique symbol = Symbol("domain.attempt.options")

/** Injects the options of the attempt capability. Parameter type: AttemptOptions. */
export const InjectAttemptOptions = (): TypedParameterDecorator<AttemptOptions> =>
    injector<AttemptOptions>(ATTEMPT_OPTIONS)
