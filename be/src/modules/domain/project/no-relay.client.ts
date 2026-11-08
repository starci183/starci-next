import { Injectable } from "@nestjs/common"
import type { RelayCheckResult } from "./project.contracts"
import type { ProjectRelayPort } from "./project-relay.port"

@Injectable()
/** The relay port while the relay is not built: no learner machine reports anything, so practice has no results. */
export class NoRelayClient implements ProjectRelayPort {
    /** Reads nothing. */
    checkResults(): Promise<ReadonlyArray<RelayCheckResult>> {
        return Promise.resolve([])
    }
}
