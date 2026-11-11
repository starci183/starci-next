import { defineConfigurableModule } from "@starci/nest-kit"
import type { RunTaskCliOptions } from "./run.options"

/** The configurable-module base of the run command. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<RunTaskCliOptions>()
