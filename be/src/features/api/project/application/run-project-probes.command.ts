import { Command } from "@nestjs/cqrs"
import type { ProbeRunView } from "@modules/domain/project"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { RunProjectProbesRequest } from "./run-project-probes.contracts"

/** Probes the deployed address of a project with the generic StarCi probes. */
export class RunProjectProbesCommand extends Command<ProbeRunView> {
    constructor(readonly params: ExecuteParams<RunProjectProbesRequest>) {
        super()
    }
}
