import { defineConfigurableModule } from "@starci/nest-kit"
import type { CheckCliOptions } from "./check.options"

/** The configurable-module base of the check command. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<CheckCliOptions>()
