import { Command } from "@nestjs/cqrs"
import type { PracticeSubmissionView } from "@modules/domain/practice"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { SubmitPracticeRequest } from "./submit-practice.contracts"

/** Asks for a submit of the solution against every test. */
export class SubmitPracticeCommand extends Command<PracticeSubmissionView> {
    constructor(readonly params: ExecuteParams<SubmitPracticeRequest>) {
        super()
    }
}
