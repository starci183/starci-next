import { QueryHandler } from "@nestjs/cqrs"
import { PracticeReadService, type PracticeNextView } from "@modules/domain/practice"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetPracticeNextQuery } from "./get-practice-next.query"

@QueryHandler(GetPracticeNextQuery)
/** Hands the next-problem read of the signed-in learner to the practice capability. */
export class GetPracticeNextHandler extends ICQRSHandler<GetPracticeNextQuery, PracticeNextView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly reads: PracticeReadService,
    ) {
        super(logger)
    }

    protected override process(message: GetPracticeNextQuery): Promise<PracticeNextView> {
        return this.reads.next({
            learnerId: message.params.principal.id,
            patternId: message.params.request.patternId,
            locale: message.params.request.locale,
        })
    }
}
