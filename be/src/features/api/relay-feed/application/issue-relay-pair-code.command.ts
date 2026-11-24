import { Command } from "@nestjs/cqrs"
import type { RelayPairCode } from "@modules/domain/relay"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { IssueRelayPairCodeRequest } from "./course-lab.contracts"

/** Issues a six-digit pairing code for the signed-in learner. */
export class IssueRelayPairCodeCommand extends Command<RelayPairCode> {
    constructor(readonly params: ExecuteParams<IssueRelayPairCodeRequest>) {
        super()
    }
}
