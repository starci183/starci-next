import { defineConfigurableModule } from "@starci/nest-kit"
import type { AttemptApiOptions } from "./attempt.options"

/** The configurable-module base of the attempt feature module. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<AttemptApiOptions>()
