import { defineCapabilityModule } from "@starci/nest-kit"
import { PRACTICE_OPTIONS } from "./practice.decorators"
import type { PracticeOptions } from "./practice.options"

/** The configurable-module base of the practice capability; `isGlobal` is decided by the app root. */
export const { ConfigurableModuleClass, OPTIONS_TYPE } = defineCapabilityModule<PracticeOptions>({
    optionsInjectionToken: PRACTICE_OPTIONS,
})
