import { QueryHandler } from "@nestjs/cqrs"
import { HarnessReadService, type HarnessGuideView } from "@modules/domain/harness"
import { RelayHarnessService } from "@modules/domain/relay"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetHarnessGuideQuery } from "./get-harness-guide.query"

@QueryHandler(GetHarnessGuideQuery)
/** Reads one guide with its sections and probe results from the harness capability and the learner relayed results; free for everyone, no Premium question. */
export class GetHarnessGuideHandler extends ICQRSHandler<GetHarnessGuideQuery, HarnessGuideView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly harness: HarnessReadService,
        private readonly relay: RelayHarnessService,
    ) {
        super(logger)
    }

    protected override async process(query: GetHarnessGuideQuery): Promise<HarnessGuideView> {
        const { tool, slug, locale } = query.params.request
        return this.harness.guide(tool, slug, locale, await this.relay.doctorResults(query.params.principal.id))
    }
}
