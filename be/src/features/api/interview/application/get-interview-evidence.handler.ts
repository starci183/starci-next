import { QueryHandler } from "@nestjs/cqrs"
import { InterviewHistoryService, type EvidenceItem } from "@modules/domain/interview"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetInterviewEvidenceQuery } from "./get-interview-evidence.query"

@QueryHandler(GetInterviewEvidenceQuery)
/** Reads the best graded result of the learner per track, pillar and tier: the interview evidence of the profile. */
export class GetInterviewEvidenceHandler extends ICQRSHandler<GetInterviewEvidenceQuery, ReadonlyArray<EvidenceItem>> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly history: InterviewHistoryService,
    ) {
        super(logger)
    }

    protected override process(command: GetInterviewEvidenceQuery): Promise<ReadonlyArray<EvidenceItem>> {
        return this.history.evidence(command.params.principal.id)
    }
}
