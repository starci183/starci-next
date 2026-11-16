import { QueryHandler } from "@nestjs/cqrs"
import { HarnessReadService, type HarnessDoctorView } from "@modules/domain/harness"
import { RelayHarnessService } from "@modules/domain/relay"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetHarnessDoctorQuery } from "./get-harness-doctor.query"

@QueryHandler(GetHarnessDoctorQuery)
/** Reads the doctor probes of one tool with the newest result of each from the harness capability and the learner relayed results; free for everyone, no Premium question. */
export class GetHarnessDoctorHandler extends ICQRSHandler<GetHarnessDoctorQuery, HarnessDoctorView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly harness: HarnessReadService,
        private readonly relay: RelayHarnessService,
    ) {
        super(logger)
    }

    protected override async process(query: GetHarnessDoctorQuery): Promise<HarnessDoctorView> {
        const { tool, locale } = query.params.request
        return this.harness.doctor(tool, locale, await this.relay.doctorResults(query.params.principal.id))
    }
}
