import { defineCapabilityModule } from "@starci/nest-kit"
import { CAREER_OPTIONS } from "./career.decorators"
import type { CareerOptions } from "./career.options"

/** The configurable-module base of the career capability; `isGlobal` is decided by the app root. */
export const { ConfigurableModuleClass, OPTIONS_TYPE } = defineCapabilityModule<CareerOptions>({
    optionsInjectionToken: CAREER_OPTIONS,
})
