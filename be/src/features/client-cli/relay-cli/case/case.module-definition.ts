import { defineConfigurableModule } from "@starci/nest-kit"
import type { CaseCliOptions } from "./case.options"

/** The configurable-module base of the case command group. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<CaseCliOptions>()
