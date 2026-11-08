import { CommandHandler } from "@nestjs/cqrs"
import { ExperienceService, type ExperienceItemView } from "@modules/domain/career"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { ShowExperienceCommand } from "./show-experience.command"

@CommandHandler(ShowExperienceCommand)
/** Hands the message to the career capability, which authorizes and decides. */
export class ShowExperienceHandler extends ICQRSHandler<ShowExperienceCommand, ExperienceItemView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly experiences: ExperienceService,
    ) {
        super(logger)
    }

    protected override process(command: ShowExperienceCommand): Promise<ExperienceItemView> {
        return this.experiences.show({ learnerId: command.params.principal.id, ...command.params.request })
    }
}
