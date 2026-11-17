import { defineCapabilityModule } from "@starci/nest-kit"
import { PROGRESS_OPTIONS } from "./progress.decorators"
import type { ProgressOptions } from "./progress.options"

/** The configurable-module base of the progress capability; `isGlobal` is decided by the app root. */
export const { ConfigurableModuleClass, OPTIONS_TYPE } = defineCapabilityModule<ProgressOptions>({
    optionsInjectionToken: PROGRESS_OPTIONS,
})
