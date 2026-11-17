import { defineConfigurableModule } from "@starci/nest-kit"
import type { ProgressApiOptions } from "./progress.options"

/** The configurable-module base of the progress feature module. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<ProgressApiOptions>()
