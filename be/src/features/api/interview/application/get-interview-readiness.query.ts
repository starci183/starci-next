import { Query } from "@nestjs/cqrs"
import type { ReadinessView } from "@modules/domain/interview"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetInterviewReadinessRequest } from "./get-interview-readiness.contracts"

/** Reads the hiring readiness at a track and tier: ready when both pillars passed. */
export class GetInterviewReadinessQuery extends Query<ReadinessView> {
    constructor(readonly params: ExecuteParams<GetInterviewReadinessRequest>) {
        super()
    }
}
