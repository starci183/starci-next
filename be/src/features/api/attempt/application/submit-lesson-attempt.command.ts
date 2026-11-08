import { Command } from "@nestjs/cqrs"
import type { AttemptView } from "@modules/domain/attempt"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { SubmitLessonAttemptRequest } from "./submit-lesson-attempt.contracts"

/** Stores the answer of a signed-in learner to a lesson activity and grades it. */
export class SubmitLessonAttemptCommand extends Command<AttemptView> {
    constructor(readonly params: ExecuteParams<SubmitLessonAttemptRequest>) {
        super()
    }
}
