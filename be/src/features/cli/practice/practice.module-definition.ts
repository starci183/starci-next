import { defineConfigurableModule } from "@starci/nest-kit"
import type { PracticeOptions } from "./practice.options"

/** The configurable-module base of the practice command group. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<PracticeOptions>()
