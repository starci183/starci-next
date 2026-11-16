import { defineConfigurableModule } from "@starci/nest-kit"
import type { ListenCliOptions } from "./listen.options"

/** The configurable-module base of the listen command. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<ListenCliOptions>()
