import { QueryHandler } from "@nestjs/cqrs"
import { ProjectReadService, type MilestoneView } from "@modules/domain/project"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetProjectMilestoneQuery } from "./get-project-milestone.query"

@QueryHandler(GetProjectMilestoneQuery)
/** Hands the message to the project capability, which authorizes and decides. */
export class GetProjectMilestoneHandler extends ICQRSHandler<GetProjectMilestoneQuery, MilestoneView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly reads: ProjectReadService,
    ) {
        super(logger)
    }

    protected override process(query: GetProjectMilestoneQuery): Promise<MilestoneView> {
        return this.reads.milestone({ learnerId: query.params.principal.id, ...query.params.request })
    }
}
