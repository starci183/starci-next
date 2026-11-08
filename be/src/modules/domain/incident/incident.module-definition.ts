import { defineCapabilityModule } from "@starci/nest-kit"
import { INCIDENT_OPTIONS } from "./incident.decorators"
import type { IncidentOptions } from "./incident.options"

/** The configurable-module base of the incident capability; `isGlobal` is decided by the app root. */
export const { ConfigurableModuleClass, OPTIONS_TYPE } = defineCapabilityModule<IncidentOptions>({
    optionsInjectionToken: INCIDENT_OPTIONS,
})
