import { defineConfigurableModule } from "@starci/nest-kit"
import type { HarnessCliOptions } from "./harness.options"

/** The configurable-module base of the harness command group. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<HarnessCliOptions>()
