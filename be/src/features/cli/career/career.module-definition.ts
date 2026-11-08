import { defineConfigurableModule } from "@starci/nest-kit"
import type { CareerCliOptions } from "./career.options"

/** The configurable-module base of the career command group. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<CareerCliOptions>()
