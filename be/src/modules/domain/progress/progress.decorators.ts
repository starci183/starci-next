import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { ProgressOptions } from "./progress.options"

/** Injection token of the options of the progress capability. */
export const PROGRESS_OPTIONS: unique symbol = Symbol("domain.progress.options")

/** Injects the options of the progress capability. Parameter type: ProgressOptions. */
export const InjectProgressOptions = (): TypedParameterDecorator<ProgressOptions> =>
    injector<ProgressOptions>(PROGRESS_OPTIONS)
