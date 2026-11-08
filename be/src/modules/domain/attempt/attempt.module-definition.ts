import { defineCapabilityModule } from "@starci/nest-kit"
import { ATTEMPT_OPTIONS } from "./attempt.decorators"
import type { AttemptOptions } from "./attempt.options"

/** The configurable-module base of the attempt capability; `isGlobal` is decided by the app root. */
export const { ConfigurableModuleClass, OPTIONS_TYPE } = defineCapabilityModule<AttemptOptions>({
    optionsInjectionToken: ATTEMPT_OPTIONS,
})
