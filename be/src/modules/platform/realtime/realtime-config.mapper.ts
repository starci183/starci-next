import type { EnvSource } from "@modules/platform/config"
import { RealtimeError, RealtimeErrorCode } from "./errors/realtime.error"
import type { RealtimeConfig } from "./realtime.options"

/**
 * Reads the hub from `REALTIME_HUB`. The memory hub is never a silent default: an app declares it, and only for one
 * replica; a shared hub (postgres, redis) is refused until it is built, so a scaled deploy cannot run on memory unseen.
 */
export const parseRealtimeConfig = (env: EnvSource): RealtimeConfig => {
    const hub = env.optional("REALTIME_HUB")
    if (hub !== "memory")
        throw new RealtimeError({ code: RealtimeErrorCode.HubUnsupported, params: { hub: hub ?? "" } })
    return { hub }
}
