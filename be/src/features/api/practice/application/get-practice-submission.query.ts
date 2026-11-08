import { Query } from "@nestjs/cqrs"
import type { PracticeSubmissionView } from "@modules/domain/practice"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetPracticeSubmissionRequest } from "./get-practice-submission.contracts"

/** Asks for one submission of the caller. */
export class GetPracticeSubmissionQuery extends Query<PracticeSubmissionView> {
    constructor(readonly params: ExecuteParams<GetPracticeSubmissionRequest>) {
        super()
    }
}
