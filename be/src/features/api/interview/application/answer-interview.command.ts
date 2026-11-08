import { Command } from "@nestjs/cqrs"
import type { AnswerView } from "@modules/domain/interview"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { AnswerInterviewRequest } from "./answer-interview.contracts"

/** Stores the answer to the open question, then asks the interviewer what follows; it shows no score and no feedback. */
export class AnswerInterviewCommand extends Command<AnswerView> {
    constructor(readonly params: ExecuteParams<AnswerInterviewRequest>) {
        super()
    }
}
