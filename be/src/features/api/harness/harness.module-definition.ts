import { defineConfigurableModule } from "@starci/nest-kit"
import type { HarnessApiOptions } from "./harness.options"

/** The configurable-module base of the harness feature module. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<HarnessApiOptions>()
