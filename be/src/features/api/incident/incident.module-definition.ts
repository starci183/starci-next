import { defineConfigurableModule } from "@starci/nest-kit"
import type { IncidentApiOptions } from "./incident.options"

/** The configurable-module base of the incident feature module. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<IncidentApiOptions>()
