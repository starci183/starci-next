import type { EnvSource } from "@modules/platform/config"
import type { IncidentOptions } from "./incident.options"

/**
 * Reads the incident settings an environment declares: `INCIDENT_AUTHORED`, a comma-separated list of lesson ids whose tier-2
 * incident is written. Only the development stack declares it (so the incident list shows an authored row); every other
 * environment leaves it undeclared and keeps the default, none authored.
 */
export const parseIncidentConfig = (env: EnvSource): Pick<IncidentOptions, "authored"> => {
    const declared = env.optional("INCIDENT_AUTHORED")
    if (declared === undefined) return {}
    return {
        authored: declared
            .split(",")
            .map((id) => id.trim())
            .filter((id) => id.length > 0),
    }
}
