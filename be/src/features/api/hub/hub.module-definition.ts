import { defineConfigurableModule } from "@starci/nest-kit"
import type { HubApiOptions } from "./hub.options"

/** The configurable-module base of the hub feature module. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } = defineConfigurableModule<HubApiOptions>()
