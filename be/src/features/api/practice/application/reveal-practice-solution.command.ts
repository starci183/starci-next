import { Command } from "@nestjs/cqrs"
import type { PracticeSolutionView } from "@modules/domain/practice"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { RevealPracticeSolutionRequest } from "./reveal-practice-solution.contracts"

/** Asks the reference solution of one problem to be revealed. */
export class RevealPracticeSolutionCommand extends Command<PracticeSolutionView> {
    constructor(readonly params: ExecuteParams<RevealPracticeSolutionRequest>) {
        super()
    }
}
