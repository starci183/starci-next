import { CommandHandler } from "@nestjs/cqrs"
import { PathService, type PathChosen } from "@modules/domain/path"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { ChooseOutcomePathCommand } from "./choose-outcome-path.command"

@CommandHandler(ChooseOutcomePathCommand)
/** Hands the chosen path of the learner to the path capability, which checks and stores it. */
export class ChooseOutcomePathHandler extends ICQRSHandler<ChooseOutcomePathCommand, PathChosen> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly paths: PathService,
    ) {
        super(logger)
    }

    protected override process(command: ChooseOutcomePathCommand): Promise<PathChosen> {
        return this.paths.choose(command.params.principal.id, command.params.request.pathId)
    }
}
