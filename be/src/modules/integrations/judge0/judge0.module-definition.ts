import { defineCapabilityModule } from "@starci/nest-kit"
import { JUDGE0_OPTIONS } from "./judge0.decorators"
import type { Judge0ModuleOptions } from "./judge0.options"

/** The configurable-module base of the Judge0 integration; `isGlobal` is decided by the app root. */
export const { ConfigurableModuleClass, OPTIONS_TYPE } = defineCapabilityModule<Judge0ModuleOptions>({
    optionsInjectionToken: JUDGE0_OPTIONS,
})
