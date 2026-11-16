import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { HarnessOptions } from "./harness.options"

/** Injection token of the options of the harness capability. */
export const HARNESS_OPTIONS: unique symbol = Symbol("domain.harness.options")

/** Injects the options of the harness capability. Parameter type: HarnessOptions. */
export const InjectHarnessOptions = (): TypedParameterDecorator<HarnessOptions> =>
    injector<HarnessOptions>(HARNESS_OPTIONS)
