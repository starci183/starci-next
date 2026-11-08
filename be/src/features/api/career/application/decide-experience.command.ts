import { Command } from "@nestjs/cqrs"
import type { DecisionResultView } from "@modules/domain/career"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { DecideExperienceRequest } from "./decide-experience.contracts"

/** Approves or returns a batch of pending items. */
export class DecideExperienceCommand extends Command<ReadonlyArray<DecisionResultView>> {
    constructor(readonly params: ExecuteParams<DecideExperienceRequest>) {
        super()
    }
}
