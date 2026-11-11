import { defineConfigurableModule } from "@starci/nest-kit"
import type { StatusCliOptions } from "./status.options"

/** The configurable-module base of the status command. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<StatusCliOptions>()
