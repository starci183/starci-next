import { CommandHandler } from "@nestjs/cqrs"
import { ProfileCvService, type CvLinkView } from "@modules/domain/profile"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { SetCvVisibilityCommand } from "./set-cv-visibility.command"

@CommandHandler(SetCvVisibilityCommand)
/** Hands the visibility change of the CV to the profile capability. */
export class SetCvVisibilityHandler extends ICQRSHandler<SetCvVisibilityCommand, CvLinkView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly cv: ProfileCvService,
    ) {
        super(logger)
    }

    protected override process(message: SetCvVisibilityCommand): Promise<CvLinkView> {
        return this.cv.setVisibility({
            learnerId: message.params.principal.id,
            accountName: message.params.request.accountName,
            isPublic: message.params.request.isPublic,
        })
    }
}
