import { Command } from "@nestjs/cqrs"
import type { PathChosen } from "@modules/domain/path"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { ChooseOutcomePathRequest } from "./outcome-paths.contracts"

/** Sets the outcome path the signed-in learner follows. */
export class ChooseOutcomePathCommand extends Command<PathChosen> {
    constructor(readonly params: ExecuteParams<ChooseOutcomePathRequest>) {
        super()
    }
}
