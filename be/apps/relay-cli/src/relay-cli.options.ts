import type { RelayCliEnv } from "./relay-cli.env"

/** The parsed configuration handed to the relay-cli composition root. */
export interface RelayCliAppOptions {
    /** The learner machine settings: the config folder, the StarCi origin and the manifest key. */
    readonly relayClient: RelayCliEnv["relayClient"]
}

/** Passes the parsed environment to composition without adding registrations. */
export const createRelayCliAppOptions = (env: RelayCliEnv): RelayCliAppOptions => ({
    relayClient: env.relayClient,
})
