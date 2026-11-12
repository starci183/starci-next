/**
 * The relay client (integration): the learner's machine talking to the relay doors of the core api. It pairs this machine, verifies the manifest
 * StarCi signed for a task, runs its allowlisted checks locally after the learner confirms, and streams the results to the relay
 * as practice. It holds no database, entitlement or ops code: it ships to learners.
 */
export { InjectRelayClient } from "./relay-client.decorators"
export { parseRelayClientConfig } from "./relay-client.config"
export { RelayClientModule } from "./relay-client.module"
export { RelayRefusalCode } from "./relay-client.contracts"
export type { RelayClientPort } from "./relay-client.port"
