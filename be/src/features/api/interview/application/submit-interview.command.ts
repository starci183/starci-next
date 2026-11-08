import { Command } from "@nestjs/cqrs"
import type { GradingView } from "@modules/domain/interview"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { SubmitInterviewRequest } from "./submit-interview.contracts"

/** Ends the interview and grades the whole session once; it answers when the grading is done or has failed. */
export class SubmitInterviewCommand extends Command<GradingView> {
    constructor(readonly params: ExecuteParams<SubmitInterviewRequest>) {
        super()
    }
}
