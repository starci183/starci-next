import { defineConfigurableModule } from "@starci/nest-kit"
import type { InitCliOptions } from "./init.options"

/** The configurable-module base of the init command. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<InitCliOptions>()
