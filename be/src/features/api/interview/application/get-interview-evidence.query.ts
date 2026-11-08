import { Query } from "@nestjs/cqrs"
import type { EvidenceItem } from "@modules/domain/interview"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetInterviewEvidenceRequest } from "./get-interview-evidence.contracts"

/** Reads the best graded result of the learner per track, pillar and tier: the interview evidence of the profile. */
export class GetInterviewEvidenceQuery extends Query<ReadonlyArray<EvidenceItem>> {
    constructor(readonly params: ExecuteParams<GetInterviewEvidenceRequest>) {
        super()
    }
}
