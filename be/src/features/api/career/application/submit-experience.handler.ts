import { CommandHandler } from "@nestjs/cqrs"
import { ExperienceService, type ExperienceItemView } from "@modules/domain/career"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { SubmitExperienceCommand } from "./submit-experience.command"

@CommandHandler(SubmitExperienceCommand)
/** Hands the message to the career capability, which authorizes and decides. */
export class SubmitExperienceHandler extends ICQRSHandler<SubmitExperienceCommand, ExperienceItemView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly experiences: ExperienceService,
    ) {
        super(logger)
    }

    protected override process(command: SubmitExperienceCommand): Promise<ExperienceItemView> {
        return this.experiences.submit({ learnerId: command.params.principal.id, ...command.params.request })
    }
}
