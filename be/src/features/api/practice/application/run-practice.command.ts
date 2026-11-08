import { Command } from "@nestjs/cqrs"
import type { PracticeSubmissionView } from "@modules/domain/practice"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { RunPracticeRequest } from "./run-practice.contracts"

/** Asks for a run of the solution against the public example. */
export class RunPracticeCommand extends Command<PracticeSubmissionView> {
    constructor(readonly params: ExecuteParams<RunPracticeRequest>) {
        super()
    }
}
