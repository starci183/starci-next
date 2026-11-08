import { defineCapabilityModule } from "@starci/nest-kit"
import { PATH_OPTIONS } from "./path.decorators"
import type { PathOptions } from "./path.options"

/** The configurable-module base of the path capability; `isGlobal` is decided by the app root. */
export const { ConfigurableModuleClass, OPTIONS_TYPE } = defineCapabilityModule<PathOptions>({
    optionsInjectionToken: PATH_OPTIONS,
})
