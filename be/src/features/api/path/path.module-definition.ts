import { defineConfigurableModule } from "@starci/nest-kit"
import type { PathApiOptions } from "./path.options"

/** The configurable-module base of the path feature module. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<PathApiOptions>()
