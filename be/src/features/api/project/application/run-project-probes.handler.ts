import { CommandHandler } from "@nestjs/cqrs"
import { ProjectProbeService, type ProbeRunView } from "@modules/domain/project"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { RunProjectProbesCommand } from "./run-project-probes.command"

@CommandHandler(RunProjectProbesCommand)
/** Hands the message to the project capability, which authorizes and decides. */
export class RunProjectProbesHandler extends ICQRSHandler<RunProjectProbesCommand, ProbeRunView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly probes: ProjectProbeService,
    ) {
        super(logger)
    }

    protected override process(command: RunProjectProbesCommand): Promise<ProbeRunView> {
        return this.probes.run(command.params.principal.id, command.params.request.projectId)
    }
}
