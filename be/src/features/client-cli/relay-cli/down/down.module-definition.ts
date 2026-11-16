import { defineConfigurableModule } from "@starci/nest-kit"
import type { DownCliOptions } from "./down.options"

/** The configurable-module base of the down command. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<DownCliOptions>()
