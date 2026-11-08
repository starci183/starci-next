import { defineConfigurableModule } from "@starci/nest-kit"
import type { ContentCliOptions } from "./content.options"

/** The configurable-module base of the content command group. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<ContentCliOptions>()
