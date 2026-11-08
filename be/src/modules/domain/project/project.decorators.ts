import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { ProjectOptions } from "./project.options"

/** Injection token of the options of the project capability. */
export const PROJECT_OPTIONS: unique symbol = Symbol("domain.project.options")

/** Injects the options of the project capability. Parameter type: ProjectOptions. */
export const InjectProjectOptions = (): TypedParameterDecorator<ProjectOptions> =>
    injector<ProjectOptions>(PROJECT_OPTIONS)
