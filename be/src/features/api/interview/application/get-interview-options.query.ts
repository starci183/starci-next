import { Query } from "@nestjs/cqrs"
import type { InterviewOptionsView } from "@modules/domain/interview"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetInterviewOptionsRequest } from "./get-interview-options.contracts"

/** Reads the tracks, the live banks, the access of the learner and the session in progress. */
export class GetInterviewOptionsQuery extends Query<InterviewOptionsView> {
    constructor(readonly params: ExecuteParams<GetInterviewOptionsRequest>) {
        super()
    }
}
