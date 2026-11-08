import { defineConfigurableModule } from "@starci/nest-kit"
import type { PracticeApiOptions } from "./practice.options"

/** The configurable-module base of the practice feature module. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<PracticeApiOptions>()
