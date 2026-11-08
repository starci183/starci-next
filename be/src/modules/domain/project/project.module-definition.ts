import { defineCapabilityModule } from "@starci/nest-kit"
import { PROJECT_OPTIONS } from "./project.decorators"
import type { ProjectOptions } from "./project.options"

/** The configurable-module base of the project capability; `isGlobal` is decided by the app root. */
export const { ConfigurableModuleClass, OPTIONS_TYPE } = defineCapabilityModule<ProjectOptions>({
    optionsInjectionToken: PROJECT_OPTIONS,
})
