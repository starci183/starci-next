import { QueryHandler } from "@nestjs/cqrs"
import { HarnessReadService, type HarnessGuideSummaryView } from "@modules/domain/harness"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetHarnessGuidesQuery } from "./get-harness-guides.query"

@QueryHandler(GetHarnessGuidesQuery)
/** Reads the guides of one tool from the harness capability; free for everyone, no Premium question. */
export class GetHarnessGuidesHandler extends ICQRSHandler<
    GetHarnessGuidesQuery,
    ReadonlyArray<HarnessGuideSummaryView>
> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly harness: HarnessReadService,
    ) {
        super(logger)
    }

    protected override process(query: GetHarnessGuidesQuery): Promise<ReadonlyArray<HarnessGuideSummaryView>> {
        return this.harness.guides(query.params.request.tool, query.params.request.locale)
    }
}
