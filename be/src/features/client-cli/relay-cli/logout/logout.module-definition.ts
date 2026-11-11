import { defineConfigurableModule } from "@starci/nest-kit"
import type { LogoutCliOptions } from "./logout.options"

/** The configurable-module base of the logout command. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<LogoutCliOptions>()
