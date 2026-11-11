import { defineConfigurableModule } from "@starci/nest-kit"
import type { DevicesCliOptions } from "./devices.options"

/** The configurable-module base of the devices command. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<DevicesCliOptions>()
