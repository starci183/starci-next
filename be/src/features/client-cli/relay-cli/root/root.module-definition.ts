import { defineConfigurableModule } from "@starci/nest-kit"
import type { RootCliOptions } from "./root.options"

/** The configurable-module base of the root command. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<RootCliOptions>()
