import { defineConfigurableModule } from "@starci/nest-kit"
import type { LoginCliOptions } from "./login.options"

/** The configurable-module base of the login command. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<LoginCliOptions>()
