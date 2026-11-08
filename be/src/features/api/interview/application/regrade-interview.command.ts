import { Command } from "@nestjs/cqrs"
import type { GradingView } from "@modules/domain/interview"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { RegradeInterviewRequest } from "./regrade-interview.contracts"

/** Grades a session again after a failed grading; the transcript is kept and the learner is not asked again. */
export class RegradeInterviewCommand extends Command<GradingView> {
    constructor(readonly params: ExecuteParams<RegradeInterviewRequest>) {
        super()
    }
}
