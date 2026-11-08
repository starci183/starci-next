import { defineConfigurableModule } from "@starci/nest-kit"
import type { InterviewCliOptions } from "./interview.options"

/** The configurable-module base of the interview command group. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<InterviewCliOptions>()
