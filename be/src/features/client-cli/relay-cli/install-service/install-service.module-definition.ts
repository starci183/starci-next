import { defineConfigurableModule } from "@starci/nest-kit"
import type { InstallServiceCliOptions } from "./install-service.options"

/** The configurable-module base of the install-service command. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<InstallServiceCliOptions>()
