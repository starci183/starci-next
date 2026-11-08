import type { Type } from "@nestjs/common"
import type { HubExperiencePort } from "./hub-experience.port"

/** Options of the hub capability. */
export interface HubOptions {
    /** Whether this capability is available app-wide. */
    readonly isGlobal?: boolean
    /** The experience read the hub shows per shard; absent, the hub shows no experience counts. */
    readonly experience?: Type<HubExperiencePort>
}
