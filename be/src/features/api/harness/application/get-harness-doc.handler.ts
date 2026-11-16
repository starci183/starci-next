import { QueryHandler } from "@nestjs/cqrs"
import { HarnessReadService, type HarnessDocView } from "@modules/domain/harness"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetHarnessDocQuery } from "./get-harness-doc.query"

@QueryHandler(GetHarnessDocQuery)
/** Reads one doc with its sections from the harness capability; free for everyone, no Premium question. */
export class GetHarnessDocHandler extends ICQRSHandler<GetHarnessDocQuery, HarnessDocView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly harness: HarnessReadService,
    ) {
        super(logger)
    }

    protected override process(query: GetHarnessDocQuery): Promise<HarnessDocView> {
        return this.harness.doc(query.params.request.slug, query.params.request.locale)
    }
}
