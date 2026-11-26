import { defineConfigurableModule } from "@starci/nest-kit"
import type { RefCliOptions } from "./ref.options"

/** The configurable-module base of the ref command. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<RefCliOptions>()
