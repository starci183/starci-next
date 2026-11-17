import { CommandHandler } from "@nestjs/cqrs"
import { PracticeExperienceService, type ExperienceItemView } from "@modules/domain/career"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { ClaimPracticeExperienceCommand } from "./claim-practice-experience.command"

@CommandHandler(ClaimPracticeExperienceCommand)
/** Hands the claim of a practice pattern to the career capability, which reads practice and decides. */
export class ClaimPracticeExperienceHandler extends ICQRSHandler<ClaimPracticeExperienceCommand, ExperienceItemView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly practice: PracticeExperienceService,
    ) {
        super(logger)
    }

    protected override process(message: ClaimPracticeExperienceCommand): Promise<ExperienceItemView> {
        return this.practice.claim({
            learnerId: message.params.principal.id,
            patternId: message.params.request.patternId,
        })
    }
}
