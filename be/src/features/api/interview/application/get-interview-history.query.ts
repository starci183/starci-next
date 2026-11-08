import { Query } from "@nestjs/cqrs"
import type { HistoryView } from "@modules/domain/interview"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetInterviewHistoryRequest } from "./get-interview-history.contracts"

/** Reads the sessions of the learner and the score trend per track and tier. */
export class GetInterviewHistoryQuery extends Query<HistoryView> {
    constructor(readonly params: ExecuteParams<GetInterviewHistoryRequest>) {
        super()
    }
}
