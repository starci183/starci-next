import { QueryHandler } from "@nestjs/cqrs"
import { ExperienceReadService, type MyExperienceView } from "@modules/domain/career"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetMyExperienceQuery } from "./get-my-experience.query"

@QueryHandler(GetMyExperienceQuery)
/** Hands the message to the career capability, which authorizes and decides. */
export class GetMyExperienceHandler extends ICQRSHandler<GetMyExperienceQuery, MyExperienceView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly reads: ExperienceReadService,
    ) {
        super(logger)
    }

    protected override process(query: GetMyExperienceQuery): Promise<MyExperienceView> {
        return this.reads.mine({ learnerId: query.params.principal.id, state: query.params.request.state })
    }
}
