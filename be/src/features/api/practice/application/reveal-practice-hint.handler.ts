import { CommandHandler } from "@nestjs/cqrs"
import { PracticeHintService, type PracticeHintText } from "@modules/domain/practice"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { RevealPracticeHintCommand } from "./reveal-practice-hint.command"

@CommandHandler(RevealPracticeHintCommand)
/** Hands one step of the hint ladder to open to the practice capability. */
export class RevealPracticeHintHandler extends ICQRSHandler<RevealPracticeHintCommand, PracticeHintText> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly hints: PracticeHintService,
    ) {
        super(logger)
    }

    protected override process(command: RevealPracticeHintCommand): Promise<PracticeHintText> {
        return this.hints.reveal({
            learnerId: command.params.principal.id,
            slug: command.params.request.slug,
            step: command.params.request.step,
            locale: command.params.request.locale,
        })
    }
}
