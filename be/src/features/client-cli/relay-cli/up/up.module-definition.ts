import { defineConfigurableModule } from "@starci/nest-kit"
import type { UpCliOptions } from "./up.options"

/** The configurable-module base of the up command. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } = defineConfigurableModule<UpCliOptions>()
