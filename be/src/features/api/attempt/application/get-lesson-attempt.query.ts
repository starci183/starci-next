import { Query } from "@nestjs/cqrs"
import type { AttemptView } from "@modules/domain/attempt"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetLessonAttemptRequest } from "./get-lesson-attempt.contracts"

/** Asks for one attempt of the signed-in learner. */
export class GetLessonAttemptQuery extends Query<AttemptView> {
    constructor(readonly params: ExecuteParams<GetLessonAttemptRequest>) {
        super()
    }
}
