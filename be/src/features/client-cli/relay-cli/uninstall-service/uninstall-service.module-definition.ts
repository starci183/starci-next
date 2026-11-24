import { defineConfigurableModule } from "@starci/nest-kit"
import type { UninstallServiceCliOptions } from "./uninstall-service.options"

/** The configurable-module base of the uninstall-service command. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<UninstallServiceCliOptions>()
