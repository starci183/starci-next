import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { IncidentOptions } from "./incident.options"

/** Injection token of the options of the incident capability. */
export const INCIDENT_OPTIONS: unique symbol = Symbol("domain.incident.options")

/** Injects the options of the incident capability. Parameter type: IncidentOptions. */
export const InjectIncidentOptions = (): TypedParameterDecorator<IncidentOptions> =>
    injector<IncidentOptions>(INCIDENT_OPTIONS)
