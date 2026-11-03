import { defineCapabilityModule } from "@starci/nest-kit"
import { ERRORS_OPTIONS } from "./errors.decorators"
import type { ErrorsOptions } from "./errors.options"

/** The configurable-module base of the errors capability; `isGlobal` is decided by the app root. */
export const { ConfigurableModuleClass, OPTIONS_TYPE } = defineCapabilityModule<ErrorsOptions>({
    optionsInjectionToken: ERRORS_OPTIONS,
})
