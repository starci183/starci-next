import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { PracticeOptions } from "./practice.options"

/** Injection token of the options of the practice capability. */
export const PRACTICE_OPTIONS: unique symbol = Symbol("domain.practice.options")

/** Injects the options of the practice capability. Parameter type: PracticeOptions. */
export const InjectPracticeOptions = (): TypedParameterDecorator<PracticeOptions> =>
    injector<PracticeOptions>(PRACTICE_OPTIONS)
