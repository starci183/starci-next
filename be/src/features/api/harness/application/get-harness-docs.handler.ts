import { QueryHandler } from "@nestjs/cqrs"
import { HarnessReadService, type HarnessDocSummaryView } from "@modules/domain/harness"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetHarnessDocsQuery } from "./get-harness-docs.query"

@QueryHandler(GetHarnessDocsQuery)
/** Reads the docs of the harness from the harness capability; free for everyone, no Premium question. */
export class GetHarnessDocsHandler extends ICQRSHandler<GetHarnessDocsQuery, ReadonlyArray<HarnessDocSummaryView>> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly harness: HarnessReadService,
    ) {
        super(logger)
    }

    protected override process(query: GetHarnessDocsQuery): Promise<ReadonlyArray<HarnessDocSummaryView>> {
        return this.harness.docs(query.params.request.locale)
    }
}
