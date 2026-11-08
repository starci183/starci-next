import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { PathOptions } from "./path.options"

/** Injection token of the options of the path capability. */
export const PATH_OPTIONS: unique symbol = Symbol("domain.path.options")

/** Injects the options of the path capability. Parameter type: PathOptions. */
export const InjectPathOptions = (): TypedParameterDecorator<PathOptions> => injector<PathOptions>(PATH_OPTIONS)
