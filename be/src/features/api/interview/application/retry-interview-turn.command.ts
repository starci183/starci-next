import { Command } from "@nestjs/cqrs"
import type { AnswerView } from "@modules/domain/interview"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { RetryInterviewTurnRequest } from "./retry-interview-turn.contracts"

/** Asks the interviewer again for the turn a failure skipped; the learner never answers twice. */
export class RetryInterviewTurnCommand extends Command<AnswerView> {
    constructor(readonly params: ExecuteParams<RetryInterviewTurnRequest>) {
        super()
    }
}
