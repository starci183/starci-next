import { defineConfigurableModule } from "@starci/nest-kit"
import type { DataOptions } from "./data.options"

/** The configurable-module base of the data module. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } = defineConfigurableModule<DataOptions>()
