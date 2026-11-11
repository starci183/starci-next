import type { EnvSource } from "@modules/platform/config"
import { parseRelayClientConfig } from "@modules/integrations/relay-client"

/** The relay-cli environment values read before composition: the learner's machine settings, all optional. */
export interface RelayCliEnv {
    /** The config folder, the StarCi origin and the manifest key of this machine. */
    readonly relayClient: ReturnType<typeof parseRelayClientConfig>
}

/** Reads the relay-cli environment once; nothing here is required, since a bare machine runs with the defaults. */
export const readRelayCliEnv = (env: EnvSource): RelayCliEnv => ({
    relayClient: parseRelayClientConfig(env),
})
