import { QueryHandler } from "@nestjs/cqrs"
import { HarnessReadService, type HarnessPack } from "@modules/domain/harness"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetHarnessPackQuery } from "./get-harness-pack.query"

@QueryHandler(GetHarnessPackQuery)
/** Answers the tarball of a live harness pack (build source, doctor probes or trap); never a hidden file. */
export class GetHarnessPackHandler extends ICQRSHandler<GetHarnessPackQuery, HarnessPack> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly harness: HarnessReadService,
    ) {
        super(logger)
    }

    protected override process(query: GetHarnessPackQuery): Promise<HarnessPack> {
        const { kind, key } = query.params.request
        return this.harness.pack(kind, key)
    }
}
