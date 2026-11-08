import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { RelayCheckResult } from "./project.contracts"
import type { RelayResultsRequest } from "./project-params.contracts"

/**
 * The port through which the Projects shard reads the check results the learner machine reported over the relay (contract.relay.channel,
 * `check.result` events, fr.relay.run-check). The relay itself is not built: until it is, the app binds `NoRelayClient`, which reads
 * none, and the integration specs bind a fake. A result is practice (practice): it never proves a concept, only a signed CI run
 * or a server probe does. Every result carries the event id the relay assigned, so a repeated delivery counts once.
 */
export interface ProjectRelayPort {
    /** The check results of the project since `after`, oldest first. */
    checkResults(request: RelayResultsRequest): Promise<ReadonlyArray<RelayCheckResult>>
}

/** Token of the relay port. */
export const PROJECT_RELAY: unique symbol = Symbol("domain.project.relay")

/** Injects the relay port. Parameter type: ProjectRelayPort. */
export const InjectProjectRelay = (): TypedParameterDecorator<ProjectRelayPort> =>
    injector<ProjectRelayPort>(PROJECT_RELAY)
