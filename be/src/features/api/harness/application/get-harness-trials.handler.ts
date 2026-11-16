import { QueryHandler } from "@nestjs/cqrs"
import { HarnessReadService, type HarnessTrapView } from "@modules/domain/harness"
import { RelayHarnessService } from "@modules/domain/relay"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetHarnessTrialsQuery } from "./get-harness-trials.query"

@QueryHandler(GetHarnessTrialsQuery)
/** Reads the trial traps with the newest result of each from the harness capability and the learner relayed results; free for everyone, no Premium question. */
export class GetHarnessTrialsHandler extends ICQRSHandler<GetHarnessTrialsQuery, ReadonlyArray<HarnessTrapView>> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly harness: HarnessReadService,
        private readonly relay: RelayHarnessService,
    ) {
        super(logger)
    }

    protected override async process(query: GetHarnessTrialsQuery): Promise<ReadonlyArray<HarnessTrapView>> {
        const { tool, locale } = query.params.request
        return this.harness.trials(locale, tool, await this.relay.trialResults(query.params.principal.id))
    }
}
