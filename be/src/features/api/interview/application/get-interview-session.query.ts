import { Query } from "@nestjs/cqrs"
import type { SessionView } from "@modules/domain/interview"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetInterviewSessionRequest } from "./get-interview-session.contracts"

/** Reads a session; the scorecard, the ideal answers and the lessons appear only once it is graded. */
export class GetInterviewSessionQuery extends Query<SessionView> {
    constructor(readonly params: ExecuteParams<GetInterviewSessionRequest>) {
        super()
    }
}
