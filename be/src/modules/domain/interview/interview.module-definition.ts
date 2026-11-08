import { defineCapabilityModule } from "@starci/nest-kit"
import { INTERVIEW_OPTIONS } from "./interview.decorators"
import type { InterviewOptions } from "./interview.options"

/** The configurable-module base of the interview capability; `isGlobal` is decided by the app root. */
export const { ConfigurableModuleClass, OPTIONS_TYPE } = defineCapabilityModule<InterviewOptions>({
    optionsInjectionToken: INTERVIEW_OPTIONS,
})
