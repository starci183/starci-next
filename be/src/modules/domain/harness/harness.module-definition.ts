import { defineCapabilityModule } from "@starci/nest-kit"
import { HARNESS_OPTIONS } from "./harness.decorators"
import type { HarnessOptions } from "./harness.options"

/** The configurable-module base of the harness capability; `isGlobal` is decided by the app root. */
export const { ConfigurableModuleClass, OPTIONS_TYPE } = defineCapabilityModule<HarnessOptions>({
    optionsInjectionToken: HARNESS_OPTIONS,
})
