import { defineConfigurableModule } from "@starci/nest-kit"
import type { CareerApiOptions } from "./career.options"

/** The configurable-module base of the career feature module. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<CareerApiOptions>()
